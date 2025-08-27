'use server';

import { appwriteConfig } from "./config"
import { Avatars, Client } from "node-appwrite"
import { cookies } from "next/headers"
import {Account, Databases, Storage} from "node-appwrite"
//node-appwrite
export const createSessionClient = async ()=>{
    const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)

    const session = ( await cookies()).get('appwrite_session');

    if(!session || !session.value) return null;

    client.setSession(session.value);

    return {
        get account(){
            return new Account(client)
        },
        get database(){
            return new Databases(client)
        },
    };
};

//ADMIN  AND SESSION CLIENT
//create instance of admin client who can access all the data

export const createAdminClient = async ()=>{
    const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey)
    return {
        get account(){
            return new Account(client)
        },
        get database(){
            return new Databases(client)
        },
        get storage(){
            return new Storage(client)
        },
        get avatars(){
            return new Avatars(client)
        },
    };
};

