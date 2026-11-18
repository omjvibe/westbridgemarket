"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Eye, 
  Search, 
  Shield, 
  Calendar, 
  Mail, 
  User, 
  Loader2, 
  Clock, 
  X,
  ExternalLink 
} from "lucide-react"

interface KYCUser {
  id: string
  full_name: string | null
  email: string | null
  kyc_status: string | null
  kyc_document_type: string | null
  kyc_document_url: string | null
  kyc_selfie_url: string | null
  kyc_submitted_at: string | null
}

export default function AdminKYCPage() {
  const [users, setUsers] = useState<KYCUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchKYCUsers()
  }, [])

  const fetchKYCUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, kyc_status, kyc_document_type, kyc_document_url, kyc_selfie_url, kyc_submitted_at")
        .not("kyc_submitted_at", "is", null)
        .order("kyc_submitted_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      console.error("Error fetching KYC users:", err)
      setMessage({ type: "error", text: err.message || "Failed to load KYC submissions" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (userId: string, newStatus: "approved" | "rejected") => {
    setActioningId(userId)
    setMessage(null)
    try {
      const { error } = await supabase
        .from("users")
        .update({ kyc_status: newStatus })
        .eq("id", userId)

      if (error) throw error

      setUsers(prev =>
        prev.map(user => (user.id === userId ? { ...user, kyc_status: newStatus } : user))
      )

      setMessage({
        type: "success",
        text: `KYC submission successfully ${newStatus === "approved" ? "approved" : "rejected"}.`,
      })
    } catch (err: any) {
      console.error("Error updating KYC status:", err)
      setMessage({ type: "error", text: err.message || "Failed to update KYC status" })
    } finally {
      setActioningId(null)
    }
  }

  // Filter users based on status and search query
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    
    if (statusFilter === "all") return matchesSearch
    return user.kyc_status === statusFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              KYC Document Review
            </h1>
            <p className="text-muted-foreground mt-1">
              Verify and manage identity documents submitted by platform users.
            </p>
          </div>
          <Button 
            onClick={fetchKYCUsers} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh List
          </Button>
        </div>

        {/* Action Status Messages */}
        {message && (
          <Card className={`border-${message.type === "success" ? "green-500" : "destructive"}/50 bg-${message.type === "success" ? "green-500" : "destructive"}/5`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMessage(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-md p-4 rounded-xl border border-border/80">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-background/50 border-border"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize whitespace-nowrap"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* KYC Document Listing */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Verification Requests ({filteredUsers.length})</CardTitle>
            <CardDescription>All submitted KYC verification documents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Fetching document submissions...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border/60 rounded-xl bg-card/20">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
                <h3 className="text-lg font-semibold">No KYC Requests Found</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                  There are no identity verification requests matching the selected filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="border-border/60 bg-card/40 hover:bg-card/70 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                    
                    {/* Status Ribbon */}
                    <div className="absolute right-0 top-0 pt-2 pr-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        user.kyc_status === "approved" 
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : user.kyc_status === "rejected"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      }`}>
                        {user.kyc_status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                        {user.kyc_status === "rejected" && <XCircle className="h-3 w-3" />}
                        {user.kyc_status === "pending" && <Clock className="h-3 w-3" />}
                        {user.kyc_status || "pending"}
                      </span>
                    </div>

                    <div className="p-6 space-y-4 flex-1">
                      {/* User Info */}
                      <div className="space-y-1.5 pt-2">
                        <h4 className="font-semibold text-lg flex items-center gap-1.5 text-foreground leading-none">
                          <User className="h-4 w-4 text-primary" />
                          {user.full_name || "Unnamed User"}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email || "No email available"}
                        </p>
                        {user.kyc_submitted_at && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Submitted: {new Date(user.kyc_submitted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <hr className="border-border/50" />

                      {/* Documents Section */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          Document Type: <span className="text-foreground capitalize">{user.kyc_document_type?.replace("_", " ") || "Passport"}</span>
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {/* Document Image Thumbnail */}
                          {user.kyc_document_url ? (
                            <div className="group relative rounded-lg overflow-hidden border border-border/80 aspect-video bg-background/50 flex items-center justify-center">
                              <img 
                                src={user.kyc_document_url} 
                                alt="ID Document" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-300">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => setSelectedImage({ url: user.kyc_document_url!, title: `${user.full_name}'s ID Document` })}
                                  className="h-8 w-8 text-white rounded-full bg-white/20 hover:bg-white/40"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <a href={user.kyc_document_url} target="_blank" rel="noopener noreferrer">
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-8 w-8 text-white rounded-full bg-white/20 hover:bg-white/40"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              </div>
                              <span className="absolute bottom-1 left-1.5 text-[9px] bg-black/70 px-1 py-0.5 rounded text-white font-medium">ID Doc</span>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-border/80 border-dashed aspect-video flex flex-col items-center justify-center text-muted-foreground p-2">
                              <XCircle className="h-4 w-4 mb-1" />
                              <span className="text-[10px] text-center">No ID Image</span>
                            </div>
                          )}

                          {/* Selfie Image Thumbnail */}
                          {user.kyc_selfie_url ? (
                            <div className="group relative rounded-lg overflow-hidden border border-border/80 aspect-video bg-background/50 flex items-center justify-center">
                              <img 
                                src={user.kyc_selfie_url} 
                                alt="Selfie holding ID" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-300">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => setSelectedImage({ url: user.kyc_selfie_url!, title: `${user.full_name}'s Selfie with ID` })}
                                  className="h-8 w-8 text-white rounded-full bg-white/20 hover:bg-white/40"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <a href={user.kyc_selfie_url} target="_blank" rel="noopener noreferrer">
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-8 w-8 text-white rounded-full bg-white/20 hover:bg-white/40"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              </div>
                              <span className="absolute bottom-1 left-1.5 text-[9px] bg-black/70 px-1 py-0.5 rounded text-white font-medium">Selfie</span>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-border/80 border-dashed aspect-video flex flex-col items-center justify-center text-muted-foreground p-2">
                              <XCircle className="h-4 w-4 mb-1" />
                              <span className="text-[10px] text-center">No Selfie</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-muted/30 border-t border-border/50 flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={actioningId !== null || user.kyc_status === "approved"}
                        onClick={() => handleUpdateStatus(user.id, "approved")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-1"
                      >
                        {actioningId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actioningId !== null || user.kyc_status === "rejected"}
                        onClick={() => handleUpdateStatus(user.id, "rejected")}
                        className="flex-1 font-semibold flex items-center justify-center gap-1"
                      >
                        {actioningId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Reject
                      </Button>
                    </div>

                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lightbox Modal for Previews */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[85vh] bg-card rounded-2xl border border-border p-4 flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center pb-2 border-b border-border/60">
              <h3 className="font-semibold text-lg text-foreground">{selectedImage.title}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedImage(null)}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 w-full overflow-auto flex items-center justify-center mt-4">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.title} 
                className="max-w-full max-h-[60vh] object-contain rounded-lg border border-border/40 shadow-2xl"
              />
            </div>
            
            <div className="mt-4 flex gap-3">
              <a href={selectedImage.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </a>
              <Button size="sm" onClick={() => setSelectedImage(null)}>
                Close Preview
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
