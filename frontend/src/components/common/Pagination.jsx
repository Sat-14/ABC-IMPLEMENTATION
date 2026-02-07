import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-8 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
      <p className="text-sm text-[#64748B]">
        Page <span className="font-bold text-[#0F172A]">{page}</span> of <span className="font-bold text-[#0F172A]">{totalPages}</span>
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white hover:text-[#0F172A] hover:border-[#93C5FD] transition-all"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          Previous
        </Button>
        <Button
          variant="secondary"
          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white hover:text-[#0F172A] hover:border-[#93C5FD] transition-all"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
