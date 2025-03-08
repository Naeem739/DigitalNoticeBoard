import { CategoryForm } from "./components/CategoryForm";


export default function NewCategoryPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Create New Category</h1>
      <div className="w-full">
        <CategoryForm/>
      </div>
    </div>
  )
}

