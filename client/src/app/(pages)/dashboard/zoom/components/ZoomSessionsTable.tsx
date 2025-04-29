"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Send,
  Edit,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
  UserPlus,
  UserCheck,
  UserX,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  position: number;
  isFree: boolean;
}

interface Registration {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  isRegistered: boolean;
  hasAccessToLinks: boolean;
  status: string;
}

interface ZoomLiveClass {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  price: number;
  registrationFee: number;
  courseFee: number;
  courseFeeEnabled: boolean;
  isActive: boolean;
  hasModules: boolean;
  isFirstModuleFree: boolean;
  currentRaga?: string;
  currentOrientation?: string;
  thumbnailUrl?: string | null;
  subscriptions?: User[];
  modules?: Module[];
  slug: string;
}

interface ZoomLiveClassTableProps {
  classes: ZoomLiveClass[];
  refreshData: () => void;
}

export default function ZoomSessionsTable({
  classes,
  refreshData,
}: ZoomLiveClassTableProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedSessions, setExpandedSessions] = useState<{
    [key: string]: boolean;
  }>({});
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<ZoomLiveClass | null>(
    null
  );
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [updatingCourseFee, setUpdatingCourseFee] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "remove" | "delete";
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const handleSendReminders = async (classId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${classId}/send-reminders`,
        {},
        { withCredentials: true }
      );
      toast({
        title: "Success",
        description: "Reminders sent successfully",
      });
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast({
        title: "Error",
        description: "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (classId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  const handleToggleCourseFee = async (classId: string, enabled: boolean) => {
    try {
      setUpdatingCourseFee(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${classId}/toggle-course-fee`,
        { courseFeeEnabled: enabled },
        { withCredentials: true }
      );
      refreshData();
      toast({
        title: "Success",
        description: `Course fee requirement ${enabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling course fee:", error);
      toast({
        title: "Error",
        description: "Failed to update course fee setting",
        variant: "destructive",
      });
    } finally {
      setUpdatingCourseFee(false);
    }
  };

  const handleViewRegistrations = async (liveClass: ZoomLiveClass) => {
    try {
      setSelectedClass(liveClass);
      setShowRegistrationsDialog(true);
      setLoadingRegistrations(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${liveClass.id}/registrations`,
        { withCredentials: true }
      );

      setRegistrations(response.data.data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive",
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedClass || selectedUsers.length === 0) return;

    setConfirmAction({
      type: "approve",
      title: "Confirm Approval",
      message: `Are you sure you want to approve ${selectedUsers.length} selected user(s)? ${
        selectedClass.courseFeeEnabled
          ? "They will still need to pay the course fee to access the class."
          : "They will get immediate access to the class."
      }`,
      action: async () => {
        try {
          setProcessingAction(true);
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedClass.id}/approve-registrations`,
            { userIds: selectedUsers },
            { withCredentials: true }
          );

          toast({
            title: "Success",
            description: "Selected registrations approved successfully",
          });

          await handleViewRegistrations(selectedClass);
          setSelectedUsers([]);
        } catch (error) {
          console.error("Error approving registrations:", error);
          toast({
            title: "Error",
            description: "Failed to approve registrations",
            variant: "destructive",
          });
        } finally {
          setProcessingAction(false);
          setShowConfirmDialog(false);
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleRemoveAccess = async () => {
    if (!selectedClass || selectedUsers.length === 0) return;

    setConfirmAction({
      type: "remove",
      title: "Confirm Access Removal",
      message: `Are you sure you want to remove access for ${selectedUsers.length} selected user(s)? They will need to be approved again to regain access.`,
      action: async () => {
        try {
          setProcessingAction(true);
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedClass.id}/remove-access`,
            { userIds: selectedUsers },
            { withCredentials: true }
          );

          toast({
            title: "Success",
            description: "Access removed for selected users",
          });

          await handleViewRegistrations(selectedClass);
          setSelectedUsers([]);
        } catch (error) {
          console.error("Error removing access:", error);
          toast({
            title: "Error",
            description: "Failed to remove access",
            variant: "destructive",
          });
        } finally {
          setProcessingAction(false);
          setShowConfirmDialog(false);
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteClass = async (liveClass: ZoomLiveClass) => {
    setConfirmAction({
      type: "delete",
      title: "Confirm Delete",
      message: `Are you sure you want to delete "${liveClass.title}"? This action cannot be undone.`,
      action: async () => {
        try {
          setIsLoading(true);
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${liveClass.id}`,
            { withCredentials: true }
          );
          toast({
            title: "Success",
            description: "Class deleted successfully",
          });
          refreshData();
        } catch (error) {
          console.error("Error deleting class:", error);
          toast({
            title: "Error",
            description: "Failed to delete class. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          setShowConfirmDialog(false);
        }
      },
    });
    setShowConfirmDialog(true);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Thumbnail</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>Reg. Fee</TableHead>
          <TableHead>Course Fee</TableHead>
          <TableHead>Course Fee Status</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subscribers</TableHead>
          <TableHead>Modules</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classes.map((liveClass) => (
          <>
            <TableRow key={liveClass.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(liveClass.id)}
                  disabled={!liveClass.hasModules || !liveClass.modules?.length}
                  className={!liveClass.hasModules ? "opacity-0" : ""}
                >
                  {expandedSessions[liveClass.id] ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                {liveClass.thumbnailUrl ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={liveClass.thumbnailUrl}
                      alt={liveClass.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    No image
                  </div>
                )}
              </TableCell>
              <TableCell>
                {liveClass.title}
                {liveClass.hasModules && (
                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                    <Layers size={12} className="mr-1" />
                    {liveClass.modules?.length || 0} modules
                    {liveClass.isFirstModuleFree && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-green-50 text-green-700 text-[10px] py-0 px-1"
                      >
                        Free first module
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>{formatDate(liveClass.startTime)}</TableCell>
              <TableCell>₹{liveClass.registrationFee}</TableCell>
              <TableCell>₹{liveClass.courseFee}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={liveClass.courseFeeEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleCourseFee(liveClass.id, checked)
                    }
                    disabled={updatingCourseFee}
                  />
                  <Label>Course Fee Required</Label>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    liveClass.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {liveClass.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>{liveClass.subscriptions?.length || 0}</TableCell>
              <TableCell>{liveClass.modules?.length || 0}</TableCell>
              <TableCell className="flex space-x-2">
                <Link href={`/dashboard/zoom/edit/${liveClass.id}`}>
                  <Button variant="outline" size="sm" title="Edit Live Class">
                    <Edit size={16} />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  title="Delete Live Class"
                  onClick={() => handleDeleteClass(liveClass)}
                >
                  <Trash2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewRegistrations(liveClass)}
                  title="Manage Registrations"
                >
                  <UserPlus size={16} />
                </Button>
                <Link href={`/dashboard/zoom/attendees/${liveClass.id}`}>
                  <Button variant="outline" size="sm" title="View Attendees">
                    <Users size={16} />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminders(liveClass.id)}
                  disabled={isLoading}
                  title="Send Reminders"
                >
                  <Send size={16} />
                </Button>
              </TableCell>
            </TableRow>
            {/* Expanded modules row */}
            {expandedSessions[liveClass.id] &&
              liveClass.hasModules &&
              liveClass.modules && (
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={10} className="p-0">
                    <div className="p-4">
                      <h4 className="text-sm font-semibold mb-2">Modules</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {liveClass.modules.map((module, index) => (
                          <div
                            key={module.id}
                            className="border rounded p-3 bg-white"
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">{module.title}</div>
                              {module.isFree && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Free
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Position: {module.position}
                            </div>
                            <div className="text-xs text-gray-500">
                              Start: {formatDate(module.startTime)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
          </>
        ))}
        {classes.length === 0 && (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8">
              No zoom live classes found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
