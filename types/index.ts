export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  avatar: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: "STUDENT" | "TEACHER";
}

export interface LoginInput {
  email: string;
  password: string;
}
export interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  topic: string | null;
  chapter: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
  downloads: number;
  views: number;
  createdAt: string;
  teacher: {
    name: string;
    avatar: string | null;
  };
  
  isBookmarked: boolean;
  stats: {
    totalBookmarks: number;
  };
  
}
export interface AssignmentSubmission {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  remarks: string | null;
  status: string;
  isCompleted: boolean;
  submittedAt: string;
}

export interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  dueDate: string;
  totalMarks: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  createdAt: string;
  teacher: { name: string | null; avatar: string | null };
  mySubmission: AssignmentSubmission | null;
  stats: { totalSubmissions: number; totalComments: number };
}

export interface AssignmentComment {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  likes: number;
  createdAt: string;
  user: { id: string; name: string | null; avatar: string | null; role: string };
}
export interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  uploadDate: string;
  thumbnail: string;
  videoUrl: string; // YouTube video ID
  order: number;
  watched: boolean;
  watchedPercentage: number;
  watchedSeconds: number;
  lastPosition: number;
  bookmarked: boolean;
}

export interface VideoFolder {
  id: string;
  name: string;
  subject: string;
  class: string;
  chapter: string | null;
  description: string;
  thumbnail: string;
  videoCount: number;
  totalDuration: string;
  totalViews: number;
  teacher: string;
  teacherAvatar: string;
  progress: number;
  completedCount: number;
  videos: VideoItem[];
}

export interface WatchStats {
  watchTime: { hours: number; minutes: number; totalSeconds: number };
  completedVideos: number;
  startedVideos: number;
  bookmarkedVideos: number;
  completionRate: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  explanation: string;
}

export interface QuizData {
  title: string;
  category: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: QuizQuestion[];
  metadata: {
    generatedAt: string;
    model: string;
    questionCount: number;
    markingScheme: { correct: string; incorrect: string; unattempted: string };
  };
}

export interface QuizScore {
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
}

export interface QuizCategoryItem {
  id: string;
  title: string;
  subject: string;
  class?: number;
  difficulty?: string;
}

export interface DoubtUser {
  id: string;
  name: string;
  avatar: string | null;
  email?: string;
  role?: string;
}

export interface DoubtReply {
  id: string;
  content: string;
  imageUrl: string | null;
  imageName: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  isPinned: boolean;
  isAccepted: boolean;
  upvotes: number;
  createdAt: string;
  user: DoubtUser;
  isMyReply: boolean;
  hasUpvoted: boolean;
}

export interface Doubt {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string | null;
  priority: string;
  imageUrl: string | null;
  imageName: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  status: string;
  isSolved: boolean;
  upvotes: number;
  views: number;
  createdAt: string;
  student: DoubtUser;
  isMyDoubt: boolean;
  hasUpvoted: boolean;
  stats: { totalReplies: number; totalUpvotes: number };
  replies: DoubtReply[];
}

export interface FeePlan {
  id: string;
  class: string;
  subject: string;
  price: number;
  originalPrice: number;
  duration: string;
  popular: boolean;
}

export interface PurchasableNote {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  topic: string | null;
  chapter: string | null;
  fileName: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
  downloads: number;
  views: number;
  price: number;
  teacher: { name: string | null; avatar: string | null };
}

export interface CartItem {
  id: string;
  type: "fee" | "hardcopy";
  name: string;
  price: number;
  qty?: number;
  subject?: string;
  class?: string;
  unitPrice?: number;
}

export interface AddressForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface PaymentOrderFull {
  id: string;
  items: CartItem[];
  address: AddressForm | null;
  subtotal: number;
  couponDiscount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: "qr" | "cod" | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  paymentProof?: string;
  userName?: string;
  userEmail?: string;
}

export interface StudyTask {
  time: string;
  task: string;
  type: "theory" | "practice" | "project" | "break" | "review";
  duration: string;
  resources: string[];
  link?: string;
  completed: boolean;
}

export interface StudyDaySchedule {
  day: number;
  title: string;
  focus: string;
  objectives: string[];
  tasks: StudyTask[];
  milestone: string;
}

export interface StudyPlanData {
  title: string;
  description: string;
  totalHours: number;
  schedule: StudyDaySchedule[];
  weeklyGoals: string[];
  tips: string[];
  resources: {
    documentation: string[];
    tutorials: string[];
    practice: string[];
  };
}

export interface StudyFormData {
  topics: string;
  days: number;
  hoursPerDay: number;
  level: "beginner" | "intermediate" | "advanced";
  goal: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  dateOfBirth: string | null;
  qualification: string | null;
  experience: string | null;
  subjects: string | null;
  specialization: string | null;
  teachingStyle: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherNote {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  topic: string | null;
  chapter: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  isPinned: boolean;
  price: number;
  downloads: number;
  views: number;
  createdAt: string;
  stats: { totalBookmarks: number };
}

export interface TeacherStudentProfile {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  phone: string | null;
  location: string | null;
  dateOfBirth: string | null;
  bio: string | null;
}

export interface TeacherSubmission {
  id: string;
  status: string;
  isCompleted: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  remarks: string | null;
  submittedAt: string;
  student: TeacherStudentProfile;
}

export interface TeacherAssignmentComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
  };
}

export interface TeacherAssignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  dueDate: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: string | null;
  isPublished: boolean;
  createdAt: string;
  stats: { totalSubmissions: number; totalComments: number };
  submissions: TeacherSubmission[];
  comments: TeacherAssignmentComment[];
}

export interface TeacherVideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  uniqueViewers: number;
  totalWatchTime: string;
  uploadDate: string;
  thumbnail: string;
  videoUrl: string;
  size: string;
  quality: string;
}

export interface TeacherVideoFolder {
  id: string;
  name: string;
  subject: string;
  class: string;
  chapter: string;
  description: string;
  thumbnail: string;
  isPublic: boolean;
  youtubePlaylistId: string | null;
  videoCount: number;
  totalDuration: string;
  totalViews: number;
  totalWatchTime: string;
  createdAt: string;
  videos: TeacherVideoItem[];
}

export interface YouTubeSyncStatus {
  channelId: string;
  channelTitle: string;
  channelThumbnail: string;
  subscriberCount: string;
  videoCount: string;
  folder: {
    id: string;
    name: string;
    videoCount: number;
    videos: { id: string; title: string; thumbnail: string; videoUrl: string; duration: string }[];
  } | null;
}

export interface TeacherChatMessage {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: string | null;
  isRead: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt?: string;
  sender: { id: string; name: string | null; avatar: string | null };
  isSelf: boolean;
}

export interface AIAssistantMessage {
  id: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  createdAt: string;
  isAI?: boolean;
}

export interface StudentOverview {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  engagementScore: number;
  lastActive: string | null;
  totalVideosWatched: number;
  totalAssignmentsSubmitted: number;
  totalNotesDownloaded: number;
  totalDoubtsAsked: number;
  totalQuizzesTaken: number;
}

export interface StudentDetailData {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    phone: string | null;
    location: string | null;
  };
  videoAnalytics: {
    totalWatched: number;
    totalWatchTime: string;
    completionRate: number;
    videos: { id: string; title: string; watchedPercentage: number; completed: boolean; lastWatched: string }[];
  };
  assignmentAnalytics: {
    totalSubmitted: number;
    totalAssigned: number;
    onTimeRate: number;
    submissions: { id: string; title: string; status: string; submittedAt: string; isCompleted: boolean }[];
  };
  notesAnalytics: {
    totalDownloaded: number;
    notes: { id: string; title: string; subject: string; downloadedAt: string }[];
  };
  doubtAnalytics: {
    totalAsked: number;
    totalSolved: number;
    doubts: { id: string; title: string; status: string; createdAt: string; repliesCount: number }[];
  };
  quizAnalytics: {
    totalTaken: number;
    averageScore: number;
    attempts: { id: string; category: string; score: number; percentage: number; takenAt: string }[];
  };
}

export interface ScheduleSession {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  color: string;
  notes: string | null;
}

export interface CustomHoliday {
  id: string;
  title: string;
  date: string;
}

export interface NationalHoliday {
  title: string;
  date: string;
  tentative?: boolean;
}

export interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  dateOfBirth: string | null;
  qualification: string | null;
  experience: string | null;
  subjects: string | null;
  specialization: string | null;
  teachingStyle: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}