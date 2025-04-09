"use client"

import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useAuth } from "@/helper/AuthContext"
import { format } from "date-fns"
import { toast } from "sonner"

// UI Components
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"


// Icons
import {
  BookOpenIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  CalendarIcon,
  UserIcon,
  AlertCircle,
  Mail,
} from "lucide-react"

// Types
import type { ApiResponseTh, Enrollment, UserSec, Purchase } from "@/type"
import EnhancedCourseCard from "../../_components/EnhancedCourseCard"
import CustomSeparator from "./custom-separator"
import UserCertificates from "./UserCertificates"
import MyLiveClasses from "./MyLiveClasses"

interface UserSubscription {
  type: "ONLINE" | "OFFLINE"
  startDate: string
  endDate: string
  fees: number
  status: "ACTIVE" | "EXPIRED"
  lastPayment: string
  progress?: number
  achievements?: number
  attendance?: number
  batchTiming?: string
  location?: string
}

interface ExtendedUserSec extends UserSec {
  subscription?: UserSubscription
  lastActive?: string
  location?: string
  totalCourses?: number
  completedCourses?: number
  certificatesEarned?: number
  joinedDate?: string
}



const LoadingState = () => (
  <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-white via-red-50 to-gray-50 mt-20">
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <CustomSeparator />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const ErrorState = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-red-50 to-gray-50">
    <Card className="w-full max-w-md">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={retry} className="bg-red-600 hover:bg-red-700 text-white">
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
)

const UserProfile = () => {
  const { checkAuth } = useAuth()
  const [user, setUser] = useState<ExtendedUserSec | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const isAuthenticated = await checkAuth()
        if (!isAuthenticated) {
          router.push("/auth")
          return
        }

        const [userResponse, enrollmentsResponse, purchasesResponse] = await Promise.all([
          axios.get<ApiResponseTh<{ user: UserSec }>>(`${process.env.NEXT_PUBLIC_API_URL}/user/get-user`),
          axios.get<ApiResponseTh<Enrollment[]>>(`${process.env.NEXT_PUBLIC_API_URL}/enrollment/user`),
          axios.get<ApiResponseTh<Purchase[]>>(`${process.env.NEXT_PUBLIC_API_URL}/purchase/my-course`),
        ])

        if (userResponse.data && userResponse.data.success) {
          setUser(userResponse.data.data.user)
          setNewName(userResponse.data.data.user.name)
        }

        if (enrollmentsResponse.data && enrollmentsResponse.data.success) {
          setEnrollments(enrollmentsResponse.data.data)
        }

        if (purchasesResponse.data && purchasesResponse.data.success) {
          setPurchases(Array.isArray(purchasesResponse.data.message) ? purchasesResponse.data.message : [])
        }
      } catch (error) {
        setError("An error occurred while fetching data")
        console.error("Fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [checkAuth, router])

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/update-name`,
        { name: newName },
      )

      if (response.data && response.data.success) {
        setUser((prevUser) => (prevUser ? { ...prevUser, name: newName } : null))
        setIsEditing(false)
        toast.success("Name updated successfully")
      }
    } catch (error) {
      console.error("Error updating name:", error)
      toast.error("Failed to update name")
    }
  }

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error} retry={() => router.refresh()} />
  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 p-6 font-plus-jakarta-sans mt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="border-red-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                {user.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                    <ShieldCheckIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <form onSubmit={handleNameUpdate} className="flex items-center gap-2">
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-xs" />
                      <Button type="submit" variant="outline" size="sm">Save</Button>
                    </form>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <Badge variant="outline" className="text-sm">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Joined {format(new Date(user.joinedDate || Date.now()), "MMMM yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Certificates Section */}
        <div className="mb-6">
          <UserCertificates />
        </div>

        {/* Live Classes Section */}
        <div className="mb-6">
          <MyLiveClasses />
        </div>

        {/* Courses Sections */}
        <div className="space-y-6">
          {/* Enrolled Courses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-red-600" />
                My Enrolled Courses
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.length === 0 ? (
                <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200">
                  <p className="text-gray-600">You haven't enrolled in any courses yet.</p>
                  <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => router.push('/courses')}>
                    Browse Courses
                  </Button>
                </Card>
              ) : (
                enrollments.map((enrollment: any) => (
                  <EnhancedCourseCard hidePrice={true} key={enrollment.course.id} course={enrollment.course} />
                ))
              )}
            </div>
          </section>

          {/* Purchased Courses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCartIcon className="h-5 w-5 text-red-600" />
                Purchased Courses
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.length === 0 ? (
                <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200">
                  <p className="text-gray-600">No purchased courses yet.</p>
                  <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => router.push('/courses')}>
                    Explore Courses
                  </Button>
                </Card>
              ) : (
                purchases.map((purchase: any) => (
                  <EnhancedCourseCard hidePrice={true} key={purchase.course.id} course={purchase.course} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

