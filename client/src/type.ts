import { Method } from "axios";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { FieldErrors, RegisterOptions, UseFormRegister } from "react-hook-form";

export interface RequestOptions {
  endpoint: string;
  method: Method;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: "include" | "omit" | "same-origin";
}

export interface RequestResult<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
  status: number | null;
  message: string;
}

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

export type AuthMode =
  | "login"
  | "register"
  | "forgotPassword"
  | "resendVerification";

export interface LoginInputs {
  email: string;
  password: string;
}

export interface RegisterInputs extends Record<string, unknown> {
  name: string;
  email: string;
  password: string;
}

export interface InputFieldProps<T extends Record<string, unknown>> {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  register: UseFormRegister<T>;
  name: keyof T;
  errors: FieldErrors<T>;
  validationRules: RegisterOptions;
  showPasswordToggle?: boolean;
}

export interface VerificationResponse {
  status: number;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      isVerified: boolean;
    };
  };
  message: string;
}

export interface RegisterFormProps {
  handleLoading: (isLoading: boolean) => void;
  handleRegistrationSuccess: () => void;
  courseSlug?: string;
}

export interface LoginFormProps {
  handleLoading: (isLoading: boolean) => void;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
  courseSlug?: string;
}

export interface PasswordResetForm {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface FileUploadProps {
  onDrop: (acceptedFiles: File[]) => void;
  file: File | null;
  preview: string | null;
  removeFile: () => void;
  accept: { [key: string]: string[] };
  label: string;
}

export interface CourseFormField {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}

export interface CourseFormData {
  title: string;
  description: string;
  price: string;
  isPublished: boolean;
}

export type ChapterFormData = {
  id?: string;
  title: string;
  description: string;
  isFree: boolean;
  isPublished: boolean;
  videoUrl?: string;
  pdfUrl?: string | null;
  audioUrl?: string | null;
};

export type ChapterFormProps = {
  initialData?: ChapterFormData[];
  onSubmit: (data: ChapterFormData[]) => Promise<void>;
  submitButtonText: string;
  title?: string;
  description?: string;
};

export interface ChapterFileUploadProps {
  onDrop: (acceptedFiles: File[]) => void;
  file: File | null;
  removeFile: () => void;
  accept: Record<string, string[]>;
  label: string;
  preview?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  price: number;
  userId: string;
  isPublished: boolean;
  language: string;
  subheading: string;
  metaTitle: string;
  metaDesc: string;
  isFeatured: boolean;
  isPopular: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  videoUrl?: string;
  paid: boolean;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  progress: number;
  course: CourseDataNew;
  createdAt?: string;
}
export interface CourseCardsProps {
  courses: CourseDataNew[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  limit?: number;
}

export interface CourseCardProps {
  course: CourseDataNew;
  formatPrice?: (price: number) => string;
}

export interface Chapter {
  id: number;
  title: string;
  isFree: boolean;
  videoUrl: string;
  description: string;
  attachments: { name: string; url: string }[];
  completed: boolean;
  paid: boolean;
  length?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse {
  statusCode: number;
  data: {
    user: User;
  };
  message: string;
  success: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  success: false;
}

export interface ProfileCardProps {
  title: string;
  children: React.ReactNode;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isVerified?: boolean;
}

export interface UserInfoProps {
  user: User;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentPassword: string;
  newPassword: string;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
}

export type ApiResult = ApiResponse | ApiErrorResponse;

export interface ApiResultSecond {
  statusCode: number;
  data: string;
  message: Course[];
  success: boolean;
}

export interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface CourseResponse {
  courses: CourseDataNew[];
  totalPages: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface ChapterData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  position: number;
  slug: string;
  isFree: boolean;
  isCompleted: boolean;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  slug?: string;
  price: number;
  salePrice?: number;
  isPublished: boolean;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  Chapter?: ChapterData[];
}

export interface ApiResponseSecond {
  data: string;
  message: CourseData;
  statusCode: number;
  success: boolean;
}

export interface BillingDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  saveAddress?: boolean;
}

export interface EnrollmentResponse {
  statusCode: number;
  data: string;
  message: {
    id: string;
    userId: string;
    courseId: string;
    createdAt: string;
    updatedAt: string;
  };
  success: boolean;
}

export interface CartItem {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    salePrice?: number;
    slug: string;
    userId: string;
    isPublished: boolean;
    categoryId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressData {
  id: string;
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  paymentStatus?: boolean;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CarouselItem {
  title: string;
  description: string;
  imageUrl: string;
}

export interface ForgotPasswordFormProps {
  handleLoading: (isLoading: boolean) => void;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
}

export interface AuthModeToggleProps {
  authMode: AuthMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
}
export interface AddressData {
  id: string;
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface AddressListProps {
  addresses: AddressData[];
  onAddressSelect: (address: AddressData) => void;
}

export interface BillingFormProps {
  register: UseFormRegister<BillingDetails>;
  errors: FieldErrors<BillingDetails>;
  user: {
    name: string;
    email: string;
  } | null;
}

interface PurchasePriceDetails {
  id: string;
  price: number;
  discountedPrice: number | null;
}
export interface PaymentVerificationData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  courseIds: string[];
  billingId: string;
  couponDetails: CouponDetails | null;
  courseDetails: PurchasePriceDetails[];
}

export interface CouponDetails {
  id: string;
  code: string;
  oneTimePerUser: boolean;
  discount: number;
}

export interface CouponFormProps {
  onCouponApplied: (discountedPrice: number, couponCode: CouponDetails) => void;
  originalPrice: number;
  courseId?: string[];
  salePrice?: number;
}

export interface UserSec {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  course: CourseDataNew;
}

export interface ApiResponseTh<T> {
  statusCode: number;
  data: T;
  message: string | Purchase[];
  success: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface EditCourseProps {
  params: {
    slug: string;
  };
}

export interface ChapterFormPropsSecond {
  onSubmit: (data: ChapterFormData[]) => Promise<void>;
  submitButtonText: string;
  isSubmitting: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface CourseDataNew {
  id: string;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  isPublished: boolean;
  language: string;
  subheading: string;
  metaTitle: string;
  metaDesc: string;
  isFeatured: boolean;
  isPopular: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  thumbnail?: string;
  videoUrl?: string;
  paid: boolean;
  slug?: string;
  createdAt?: string;
  duration?: number;
  sections: Section[];
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  gracePeriod?: number;
}

export interface Section {
  id: string;
  title: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  slug: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  chapters: ChapterDataNew[];
}

export interface ChapterDataNew {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  position: number;
  isFree: boolean;
  isPublished: boolean;
  slug: string;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;
  progress?: {
    watchedTime: number;
  };
  pdfUrl?: string;
  audioUrl?: string;
}

export interface CourseSeo {
  title: string;
  description: string;
  slug: string;
  thumbnail: string;
  metaTitle: string;
  metaDesc: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnimatedTextProps2 {
  text: string;
  className?: string;
  letterSpacing?: string;
}

export interface ReviewSectionProps {
  courseId: string;
  isEnrolled: boolean;
  hasPurchased: boolean;
  userId?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  isEdited: boolean;
  userId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Fee {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: string;
  description?: string;
  lateFeeDate?: string;
  lateFeeAmount?: number;
  isOfflineFee: boolean;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  totalPaid: number;
  remaining: number;
  gracePeriod?: number;
}

export interface FeeFormData {
  title: string;
  amount: number;
  dueDate: string;
  type: string;
  description?: string;
  lateFeeDate?: string;
  lateFeeAmount?: number;
  isOfflineFee: boolean;
  userId: string;
  gracePeriod?: number;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  dribbble?: string;
}

export interface InstructorData {
  id: number;
  name: string;
  role: string;
  image: string;
  bio?: string;
  experience?: string;
  expertise?: string[];
  rating?: number;
  totalStudents?: number;
  totalCourses?: number;
  socials: SocialLinks;
}

export interface Dot {
  id: number;
  x: number;
  y: number;
}

export interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export interface Course2 {
  id: string;
  title: string;
  description?: string;
  image: string;
  slug?: string;
}

export interface CourseCard2Props {
  course: Course2;
  formatPrice?: (price: number) => string;
}

export type CourseCategory =
  | "All"
  | "DEVELOPMENT"
  | "DESIGN"
  | "CLOUD"
  | "MARKETING"
  | "BUSINESS";

export interface CourseListingProps {
  defaultCategory?: CourseCategory;
  limit?: number;
}

export interface CustomButtonProps {
  primaryText: string;
  secondaryText: string;
  icon?: ReactNode;
  href?: string;
  className?: string;
  variant?: "filled" | "outlined";
  bgColor?: string;
  textColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
  onClick?: () => void;
}

export interface ImageType {
  src: string;
  alt: string;
}

export interface StatType {
  label: string;
  endValue: number;
  number?: string;
}

export interface HeroSectionProps {
  smallText?: string;
  title: string;
  description?: string;
  image?: ImageType;
  backgroundColor?: string;
  buttons?: ReactNode;
  stats?: StatType[];
  className?: string;
  scale?: number;
  variant?: "home" | "page";
  backgroundImage?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  content: string;
  rating: number;
  videoUrl: string;
}

export interface CompanyLogo {
  name: string;
  image: string;
}

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  content: string;
}

export interface AccordionItemProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export interface InfiniteTextScrollProps {
  text: string;
  speed?: number;
  content: string;
}
