"use server";

import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { strict } from "assert";

const getUserByEmail = async (email: string) => {
  const { database } = await createAdminClient();
  console.log("getting user by email", email);
  const result = await database.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    [Query.equal("email", [email])]
  );
  console.log("result", result);
  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.error("Error details:", error);
  console.error("Error message:", message);
  throw new Error(message);
};

export const sendEmailOtp = async ({ email }: { email: string }) => {
  console.log("sending email otp", email);
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email otp");
  }
};

export const getCurrentUser = async ()=>{
  const sessionClient = await createSessionClient();
  
  if (!sessionClient) {
    return null;
  }
  
  const {database, account} = sessionClient;
  console.log("getting current user");
  
  try {
    const result = await account.get();
    const  user = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", result.$id)]
    );
    if(user.total <= 0) return null;
    return parseStringify(user.documents[0]);
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(accountId, password);
    
    (await cookies()).set('appwrite_session', session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true
    });
    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
};

const createAcc = async ({
  fullname,
  email,
}: {
  fullname: string;
  email: string;
}) => {
  try {
    console.log("creating account", fullname, email);

    // Validate environment variables
    if (
      !appwriteConfig.endpointUrl ||
      !appwriteConfig.projectId ||
      !appwriteConfig.secretKey
    ) {
      throw new Error(
        "Appwrite configuration is incomplete. Please check your environment variables."
      );
    }

    const existingUser = await getUserByEmail(email);
    const accountId = await sendEmailOtp({ email });

    if (!accountId) {
      handleError(null, "Failed to send email otp");
    }

    if (!existingUser) {
      const { database } = await createAdminClient();
      await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        {
          fullname,
          email,
          avatar:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZJCYmpfIdtBnJ-VjmQMvsO6NPR6QPNs2_KsPoa3Q4wLDnyh0htMBDRqpzoNkK_wUsdmU&usqp=CAU",
          accountId,
        }
      );
    }

    return parseStringify({ accountId });
  } catch (error) {
    console.error("Error in createAcc:", error);
    throw error;
  }
};

export { createAcc };
