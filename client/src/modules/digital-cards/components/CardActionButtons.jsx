const BTN_SHAPES = {
  rounded: 'rounded-xl',
  pill: 'rounded-full',
  square: 'rounded-none',
}

const BTN_SIZES = {
  sm: 'min-h-[40px] py-2 px-3 text-xs',
  md: 'min-h-[44px] py-2.5 px-4 text-sm',
  lg: 'min-h-[48px] py-3 px-5 text-base',
}

export default function CardActionButtons({
  orderedActions,
  actionMeta,
  a,
  theme,
  buttonFontStyle,
  isPreview,
  onActionClick,
  onSaveContact,
}) {
  if (!orderedActions.length) return null

  const btnShapeCls = BTN_SHAPES[a.buttonShape || 'rounded'] || 'rounded-xl'
  const btnSizeCls = BTN_SIZES[a.buttonSize || 'md'] || 'min-h-[44px] py-2.5 px-4 text-sm'
  const isNeo = theme.id === 'bold-modern'
  const isGlass = theme.id === 'glass-tech'
  const isLuxury = theme.id === 'premium-dark'

  // Pick one flagship CTA: Save Contact if present, otherwise first action
  const primaryAction =
    orderedActions.find((act) => act.type === 'save_contact') || orderedActions[0]
  const secondaryActions = orderedActions.filter((act) => act.id !== primaryAction.id)

  const getBtnStyle = (isPrimary) => {
    const baseBg = a.buttonBgColor || a.primaryColor || '#1B6B4A'
    const baseText = a.buttonTextColor || '#FFFFFF'

    if (a.buttonStyle === 'outlined') {
      return {
        ...buttonFontStyle,
        backgroundColor: isPrimary ? `${baseBg}12` : 'transparent',
        color: baseBg,
        border: `1.5px solid ${baseBg}`,
      }
    }
    if (a.buttonStyle === 'soft') {
      return {
        ...buttonFontStyle,
        backgroundColor: isPrimary ? `${baseBg}26` : `${baseBg}14`,
        color: theme.isDark ? '#F8FAFC' : baseBg,
        border: `1px solid ${baseBg}${isPrimary ? '55' : '2E'}`,
      }
    }
    if (isPrimary) {
      return {
        ...buttonFontStyle,
        backgroundColor: baseBg,
        color: baseText,
        border: isNeo ? `2px solid ${a.secondaryColor || '#111827'}` : '1px solid transparent',
        boxShadow: isNeo
          ? `3px 3px 0px ${a.secondaryColor || '#111827'}`
          : isLuxury
            ? `0 10px 24px -8px ${baseBg}66`
            : isGlass
              ? `0 10px 26px -8px ${baseBg}55`
              : `0 10px 22px -10px ${baseBg}75`,
      }
    }
    return {
      ...buttonFontStyle,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.04)',
      color: a.textColor || '#171716',
      border: `1px solid ${theme.subtleBorderColor(a)}`,
    }
  }

  const renderAction = (act, isPrimary) => {
    const meta = actionMeta[act.type]
    const Icon = meta.icon
    const label = act.label || act.type
    const commonClass = `w-full min-w-0 ${btnSizeCls} ${btnShapeCls} font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2`

    if (meta.isSave) {
      return (
        <button
          key={act.id}
          type="button"
          onClick={() => {
            onActionClick?.(meta.event)
            onSaveContact?.()
          }}
          style={getBtnStyle(isPrimary)}
          className={commonClass}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      )
    }

    return (
      <a
        key={act.id}
        href={isPreview ? undefined : meta.href}
        target={meta.external && !isPreview ? '_blank' : undefined}
        rel={meta.external ? 'noopener noreferrer' : undefined}
        onClick={(e) => {
          if (isPreview) e.preventDefault()
          onActionClick?.(meta.event)
        }}
        style={getBtnStyle(isPrimary)}
        className={commonClass}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </a>
    )
  }

  const useTwoColSecondary = secondaryActions.length >= 2

  return (
    <div className="space-y-2.5">
      {renderAction(primaryAction, true)}
      {secondaryActions.length > 0 && (
        <div
          className={`grid gap-2.5 ${
            useTwoColSecondary ? 'grid-cols-1 min-[340px]:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {secondaryActions.map((act) => renderAction(act, false))}
        </div>
      )}
    </div>
  )
}
