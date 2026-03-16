import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Book, Plus, Trash2, Search, BookOpen, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LibraryManagement({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();
  const [bookSearch, setBookSearch] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", category: "", copies: "1" });
  const [issueForm, setIssueForm] = useState({ bookId: "", studentId: "", dueDate: "" });

  const { data: students } = useQuery({
    queryKey: ["active-students-library", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name, grade").eq("center_id", centerId).eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["library-books", centerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").eq("center_id", centerId);
      if (error) throw error;
      return data;
    },
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["book-loans", centerId],
    queryFn: async () => {
      // Joining with books and users (simplified)
      const { data, error } = await supabase
        .from("book_loans")
        .select(`
          *,
          books:book_id(title),
          users:user_id(username)
        `)
        .eq("center_id", centerId)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const issueBookMutation = useMutation({
    mutationFn: async () => {
      const { error: loanError } = await supabase.from("book_loans").insert({
        center_id: centerId,
        book_id: issueForm.bookId,
        student_id: issueForm.studentId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: issueForm.dueDate,
        status: 'Issued'
      } as any);
      if (loanError) throw loanError;

      // Decrement available copies
      const { data: book } = await supabase.from('books').select('available_copies').eq('id', issueForm.bookId).single();
      if (book) {
        await supabase.from('books').update({ available_copies: Math.max(0, book.available_copies - 1) }).eq('id', issueForm.bookId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-loans"] });
      queryClient.invalidateQueries({ queryKey: ["library-books"] });
      setIssueForm({ bookId: "", studentId: "", dueDate: "" });
      setShowIssueForm(false);
      toast.success("Book issued successfully");
    },
    onError: (error: any) => toast.error(error.message)
  });

  const addBookMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("books").insert({
        center_id: centerId,
        title: bookForm.title,
        author: bookForm.author,
        isbn: bookForm.isbn,
        category: bookForm.category,
        total_copies: parseInt(bookForm.copies),
        available_copies: parseInt(bookForm.copies),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-books"] });
      setBookForm({ title: "", author: "", isbn: "", category: "", copies: "1" });
      setShowAddBook(false);
      toast.success("Book added to catalog");
    }
  });

  const returnBookMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const { data: loan } = await supabase.from("book_loans").select("book_id").eq("id", loanId).single();
      const { error } = await supabase.from("book_loans").update({
        return_date: new Date().toISOString().split('T')[0],
        status: 'Returned'
      }).eq("id", loanId);
      if (error) throw error;

      // Increment available copies
      if (loan) {
        await supabase.rpc('increment_available_copies', { row_id: loan.book_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-loans"] });
      queryClient.invalidateQueries({ queryKey: ["library-books"] });
      toast.success("Book returned successfully");
    }
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="catalog">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="catalog" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">Book Catalog</TabsTrigger>
          <TabsTrigger value="loans" className="rounded-lg px-6 font-bold text-xs uppercase tracking-widest">Issue / Return</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4 pt-4">
          <div className="flex justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search books..."
                className="pl-10 rounded-xl"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowAddBook(!showAddBook)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              {showAddBook ? "Cancel" : "Add Book"}
            </Button>
          </div>

          {showAddBook && (
            <Card className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Book Title</Label>
                    <Input value={bookForm.title} onChange={(e) => setBookForm({...bookForm, title: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Author</Label>
                    <Input value={bookForm.author} onChange={(e) => setBookForm({...bookForm, author: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">ISBN</Label>
                    <Input value={bookForm.isbn} onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Category</Label>
                    <Input value={bookForm.category} onChange={(e) => setBookForm({...bookForm, category: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Copies</Label>
                    <Input type="number" value={bookForm.copies} onChange={(e) => setBookForm({...bookForm, copies: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => addBookMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Save Book</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Title</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Author</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Category</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Availability</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books?.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-bold">{b.title}</TableCell>
                    <TableCell className="text-sm">{b.author}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase">{b.category}</Badge></TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-bold", b.available_copies > 0 ? "text-emerald-600" : "text-rose-600")}>
                        {b.available_copies} / {b.total_copies} available
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowIssueForm(!showIssueForm)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              {showIssueForm ? "Cancel" : "New Issue"}
            </Button>
          </div>

          {showIssueForm && (
            <Card className="rounded-2xl border-none shadow-soft bg-emerald-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-emerald-800/60">Book</Label>
                    <select
                      value={issueForm.bookId}
                      onChange={e => setIssueForm({...issueForm, bookId: e.target.value})}
                      className="w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select Book</option>
                      {books?.filter((b: any) => b.available_copies > 0).map((b: any) => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-emerald-800/60">Student</Label>
                    <select
                      value={issueForm.studentId}
                      onChange={e => setIssueForm({...issueForm, studentId: e.target.value})}
                      className="w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select Student</option>
                      {students?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-emerald-800/60">Due Date</Label>
                    <Input type="date" value={issueForm.dueDate} onChange={e => setIssueForm({...issueForm, dueDate: e.target.value})} className="h-10 rounded-lg" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => issueBookMutation.mutate()} className="w-full h-10 rounded-lg font-black uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">Confirm Issue</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-2xl overflow-hidden bg-white shadow-soft">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Book</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Issued To</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Issue Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Due Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans?.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-bold">{l.books?.title}</TableCell>
                    <TableCell className="text-sm">{l.users?.username}</TableCell>
                    <TableCell className="text-xs">{l.issue_date}</TableCell>
                    <TableCell className="text-xs">{l.due_date}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'Returned' ? 'secondary' : 'default'} className="text-[9px] font-black uppercase">
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {l.status === 'Issued' && (
                        <Button variant="outline" size="sm" onClick={() => returnBookMutation.mutate(l.id)} className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          <RotateCcw className="h-3 w-3 mr-1" /> Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
