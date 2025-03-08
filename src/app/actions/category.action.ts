'use server'
import { prisma } from "@/db/prisma"




export const createCategory = async(formData:Record<string,string>) =>{
    const name = formData.name.toUpperCase();

    try{
        const result = await prisma.category.create({
            data:{
                name:name
            }
        })
        console.log(result,"_________________result");

        if(result){
            return {success:true, message: "Category is Created Successfully!"};
        }
        else{
            
            return {success:false, message: "Something went wrong!"};
    
        }

    }
    catch(error){
        // console.log(error);
        return {success:false, message: error };

    }
  
}


export const getCategories = async() =>{
    try{
        const result = await prisma.category.findMany();

        return {success:true, result}

       

    }
    catch(error){
        return {success:false, result:error};

    }
    
}
export const getCategoriesWithNotices = async() =>{
    try{
        const result = await prisma.category.findMany({
            include:{
                notices:true
            }
        });

        return {success:true, result}

       

    }
    catch(error){
        return {success:false, result:error};

    }
    
}