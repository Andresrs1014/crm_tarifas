interface Props {
  children: React.ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: Props) {
  return (
    <div
      className={className}
      style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px' }}
    >
      {children}
    </div>
  )
}
