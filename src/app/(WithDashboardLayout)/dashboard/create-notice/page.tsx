"use client";

import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  // SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories } from "@/app/actions/category.action";
import { Category } from "@/types/types";
import { createNotice } from "@/app/actions/notice.action";
// import { saveArticle } from "@/lib/storage"
// import { toast } from "sonner";
// import Image from "next/image";
// import { createArticle } from "@/app/actions/article.action";

export default function ArticleEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const getData = async () => {
      const categories = await getCategories();
      if (categories.success) {
        console.log(categories);
        setCategories(categories.result as []);
      }
    };

    getData();
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  //   const router = useRouter()

  //   const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
  //     const file = e.target.files?.[0];
  //     if (file) {
  //       setPhoto(file as File);
  //       const reader = new FileReader();
  //       reader.onloadend = () => {
  //         setPreview(reader.result as string);
  //       };
  //       reader.readAsDataURL(file);
  //     }
  //   };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !content || !selectedCategory) return;

    setIsSaving(true);

    const specificCategory = categories.filter(category => category.name === selectedCategory);
    console.log(specificCategory);

    const data = {

      title : title,
      content: content,
      category : selectedCategory,
      categoryId: specificCategory[0].id!, 
    
    }
    try {
        const article =  await createNotice(data);
        console.log(article);
      // if(article){

      //   // toast.success("Article saved successfully!");
      // }
      // else{
      //   // toast.error("Failed to save content")
      // }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {

      // toast.error("Failed to save article");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-7">
        <div className="mb-4">
          <Select
            onValueChange={(value: string) => setSelectedCategory(value)}
            value={selectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Set Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Article Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold mb-4"
          />
        </div>

        {/* <div>
        <label
          htmlFor="photo"
          className="block text-sm font-medium text-gray-700"
        >
          Photo
        </label>
        <input
          type="file"
          id="photo"
          name="photo"
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
          required
        />
      </div> */}
        {/* {preview && (
        <div className="mt-4">
          <Image
            src={preview || "/placeholder.svg"}
            alt="Preview"
            width={200}
            height={200}
            className="rounded-md"
          />
        </div>
      )} */}

        <Tabs defaultValue="write" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write">
            <Card className="p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article here..."
                className="w-full h-[500px] p-4 font-mono text-base resize-none border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ whiteSpace: "pre-wrap" }}
              />
            </Card>
          </TabsContent>
          <TabsContent value="preview">
            <Card className="p-4">
              <div className="prose max-w-none">
                <h1>{title}</h1>
                <pre className="whitespace-pre-wrap font-sans text-base p-4 min-h-[500px] bg-background">
                  {content}
                </pre>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={isSaving || !title || !content}>
            {isSaving ? "Saving..." : "Save Article"}
          </button>
        </div>
      </form>
    </div>
  );
}
