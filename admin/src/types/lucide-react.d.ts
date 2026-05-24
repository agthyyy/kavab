declare module 'lucide-react' {
  import * as React from 'react'

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
  }

  export type LucideIcon = React.FC<LucideProps>

  export const Users: LucideIcon
  export const BookOpen: LucideIcon
  export const Trophy: LucideIcon
  export const LogOut: LucideIcon
  export const Plus: LucideIcon
  export const Pencil: LucideIcon
  export const UserX: LucideIcon
  export const UserPlus: LucideIcon
  export const Send: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronRight: LucideIcon
  export const Edit: LucideIcon
  export const Trash: LucideIcon
  export const Check: LucideIcon
  export const X: LucideIcon
  export const Award: LucideIcon
}
