export default function AuthField({ label, name, type = 'text', placeholder, icon, rightIcon, value, onChange, autoComplete }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium mb-1.5" style={{ fontSize: 12.5, color: '#374151' }}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full transition focus:outline-none focus:bg-white focus:border-[#4e9a5f]"
          style={{
            height: 44,
            border: '1.5px solid #e5e7eb',
            borderRadius: 12,
            paddingLeft: icon ? 42 : 14,
            paddingRight: rightIcon ? 44 : 14,
            fontSize: 13.5,
            background: '#f9fafb',
            color: '#111827',
          }}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  )
}
