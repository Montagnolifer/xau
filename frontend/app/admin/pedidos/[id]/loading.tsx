import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="h-96 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-96 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
    </div>
  )
}
