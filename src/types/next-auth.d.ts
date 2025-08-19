import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session{
        user:{
            id?: string | undefined;
            name?: string | null;
            email?:string | null;
            role?: string;
            // Optional list of routes a moderator is allowed to access
            allowedRoutes?: string[];
        } & DefaultSession['user']
       

    }
    interface Token{
        name:string ;
        email:string ;
        sub:email;
        role?: string;
    }

}
declare module 'next-auth' {
    interface Token{
        name:string;
        email:string;
        sub:string;
        id:string;
        role?: string;
        allowedRoutes?: string[];
    }

}