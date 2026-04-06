import type { Plan } from '../../types'

const planStyles: Record<Plan, string> = {
  free: 'bg-surface text-text-secondary',
  pro: 'bg-primary text-white',
  lifetime: 'bg-primary text-white'
}

export default function Badge({ plan }: { plan: Plan }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${planStyles[plan]}`}
    >
      {plan}
    </span>
  )
}
