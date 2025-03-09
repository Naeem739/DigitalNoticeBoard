"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, Trash, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

type Notice = {
  id: string;
  title: string;
  description: string;
  category: string;
  time: string;
};

export default function ShowNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notices");
      const data = await res.json();
      setNotices(data.sort((a: Notice, b: Notice) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast.error("Failed to fetch notices.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    try {
      await fetch(`/api/notices/${id}`, {
        method: "DELETE",
      });
      setNotices((prev) => prev.filter((notice) => notice.id !== id));
      toast.success("Notice deleted successfully!");
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Failed to delete notice.");
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setDescription(notice.description);
    setCategory(notice.category);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;

    if (title.trim() === "" || description.trim() === "" || category.trim() === "") {
      toast.error("All fields are required.");
      return;
    }

    try {
      await fetch(`/api/notices/${editingNotice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category }),
      });

      setNotices((prev) =>
        prev.map((notice) =>
          notice.id === editingNotice.id ? { ...notice, title, description, category } : notice
        )
      );

      setIsEditModalOpen(false);
      setEditingNotice(null);
      setTitle("");
      setDescription("");
      setCategory("");
      toast.success("Notice updated successfully!");
    } catch (error) {
      console.error("Error updating notice:", error);
      toast.error("Failed to update notice.");
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "Asia/Dhaka", // Change based on the required time zone
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">📢 Notices</h1>

      {loading ? (
        <div className="flex justify-center items-center">
          <Loader className="animate-spin h-10 w-10" />
        </div>
      ) : (
        <div className="grid gap-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="p-4 shadow-md border border-gray-200">
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{notice.title}</h2>
                    <p className="text-gray-600">{notice.description}</p>
                    <p className="text-sm text-gray-400">📅 {formatTime(notice.time)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="icon" variant="outline" onClick={() => handleEdit(notice)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(notice.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Notice Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>✏️ Edit Notice</DialogTitle>
          <form onSubmit={handleUpdate}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full p-3 border rounded mb-4"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full p-3 border rounded mb-4"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border rounded mb-4"
              required
            >
              <option value="General">General</option>
              <option value="Event">Event</option>
              <option value="Urgent">Urgent</option>
              <option value="Reminder">Reminder</option>
            </select>
            <DialogFooter>
              <Button type="submit">Save Notice</Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
