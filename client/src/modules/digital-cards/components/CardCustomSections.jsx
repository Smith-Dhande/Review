import { Award, ArrowUpRight, Sparkles } from 'lucide-react'

function safeHref(url) {
  const s = String(url || '').trim()
  return /^https?:\/\//i.test(s) ? s : ''
}

export default function CardCustomSections({
  visibleSections,
  a,
  theme,
  dividerBorder,
  headingStyle,
  isPreview,
}) {
  if (!visibleSections.length) return null

  const accent = a.accentColor || a.primaryColor || '#1B6B4A'
  const borderCol = theme.subtleBorderColor(a)
  const isNeo = theme.id === 'bold-modern'

  return (
    <>
      {visibleSections.map((sec) => (
        <section
          key={sec.id}
          className={`pt-5 border-t ${dividerBorder} space-y-3`}
        >
          {sec.title && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <h2
                  style={headingStyle}
                  className={`${theme.sectionTitleClass} tracking-tight break-words`}
                >
                  {sec.title}
                </h2>
              </div>
              {sec.subtitle && (
                <p className="text-xs opacity-70 pl-3.5">{sec.subtitle}</p>
              )}
            </div>
          )}

          {sec.content && (
            <p className="text-xs sm:text-[13px] opacity-85 whitespace-pre-line leading-relaxed">
              {sec.content}
            </p>
          )}

          {sec.items?.length > 0 && (
            <>
              {/* Skills: refined pill tags */}
              {sec.type === 'skills' && (
                <div className="flex flex-wrap gap-1.5">
                  {sec.items.map((item) => (
                    <span
                      key={item.id}
                      className={`px-3 py-1 ${isNeo ? 'rounded-none border-2' : 'rounded-full border'} text-xs font-medium`}
                      style={{
                        backgroundColor: `${accent}14`,
                        borderColor: isNeo ? a.secondaryColor || '#111827' : `${accent}33`,
                        color: theme.isDark ? '#F8FAFC' : accent,
                      }}
                    >
                      {item.title}
                    </span>
                  ))}
                </div>
              )}

              {/* Gallery: clean 2-col lazy image grid */}
              {sec.type === 'gallery' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {sec.items.map((item) => {
                    const imgUrl = safeHref(item.image?.url)
                    const itemUrl = safeHref(item.url)
                    const Wrapper = itemUrl && !isPreview ? 'a' : 'div'
                    return (
                      <Wrapper
                        key={item.id}
                        href={itemUrl && !isPreview ? itemUrl : undefined}
                        target={itemUrl && !isPreview ? '_blank' : undefined}
                        rel={itemUrl ? 'noopener noreferrer' : undefined}
                        style={{ borderColor: borderCol }}
                        className={`group relative overflow-hidden border ${isNeo ? 'rounded-none' : 'rounded-xl'} ${theme.cardSurfaceClass}`}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.title || 'Gallery image'}
                            loading="lazy"
                            className="w-full h-28 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center text-xs opacity-60 px-2 text-center">
                            {item.title}
                          </div>
                        )}
                        {item.title && imgUrl && (
                          <div className="px-2.5 py-1.5 text-[11px] font-medium truncate">
                            {item.title}
                          </div>
                        )}
                      </Wrapper>
                    )
                  })}
                </div>
              )}

              {/* Portfolio: 2-col visual showcase cards */}
              {sec.type === 'portfolio' && (
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5">
                  {sec.items.map((item) => {
                    const imgUrl = safeHref(item.image?.url)
                    const itemUrl = safeHref(item.url)
                    return (
                      <div
                        key={item.id}
                        style={{ borderColor: borderCol }}
                        className={`overflow-hidden border ${isNeo ? 'rounded-none' : 'rounded-xl'} ${theme.cardSurfaceClass} flex flex-col`}
                      >
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt={item.title || 'Portfolio item'}
                            loading="lazy"
                            className="w-full h-28 object-cover"
                          />
                        )}
                        <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-semibold break-words">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-[11px] opacity-75 mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {itemUrl && (
                            <a
                              href={isPreview ? undefined : itemUrl}
                              target={isPreview ? undefined : '_blank'}
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (isPreview) e.preventDefault()
                              }}
                              style={{ color: accent }}
                              className="text-[11px] font-semibold inline-flex items-center gap-1 pt-1.5 hover:underline"
                            >
                              <span>View Project</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Achievements: timeline highlight rail */}
              {sec.type === 'achievements' && (
                <div className="space-y-3 pl-1">
                  {sec.items.map((item, idx) => (
                    <div key={item.id} className="relative pl-5">
                      {idx < sec.items.length - 1 && (
                        <span
                          className="absolute left-[5px] top-3 bottom-[-12px] w-px opacity-25"
                          style={{ backgroundColor: accent }}
                        />
                      )}
                      <span
                        className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                        style={{
                          borderColor: accent,
                          backgroundColor: a.cardBgColor || '#FFFFFF',
                        }}
                      />
                      <p className="text-xs font-semibold break-words">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[11px] opacity-75 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications: credential badges */}
              {sec.type === 'certifications' && (
                <div className="space-y-2">
                  {sec.items.map((item) => {
                    const itemUrl = safeHref(item.url)
                    return (
                      <div
                        key={item.id}
                        style={{ borderColor: borderCol }}
                        className={`border ${isNeo ? 'rounded-none' : 'rounded-xl'} ${theme.cardSurfaceClass} p-3 flex items-start gap-2.5`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${accent}18`, color: accent }}
                        >
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold break-words">
                              {item.title}
                            </p>
                            {itemUrl && (
                              <a
                                href={isPreview ? undefined : itemUrl}
                                target={isPreview ? undefined : '_blank'}
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (isPreview) e.preventDefault()
                                }}
                                style={{ color: accent }}
                                className="text-[11px] font-medium inline-flex items-center gap-0.5 shrink-0 hover:underline"
                              >
                                <span>Verify</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] opacity-75 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Custom Links: designed CTA link cards */}
              {sec.type === 'links' && (
                <div className="space-y-2">
                  {sec.items.map((item) => {
                    const itemUrl = safeHref(item.url)
                    return (
                      <a
                        key={item.id}
                        href={isPreview || !itemUrl ? undefined : itemUrl}
                        target={itemUrl && !isPreview ? '_blank' : undefined}
                        rel={itemUrl ? 'noopener noreferrer' : undefined}
                        onClick={(e) => {
                          if (isPreview || !itemUrl) e.preventDefault()
                        }}
                        style={{ borderColor: borderCol }}
                        className={`group flex items-center justify-between gap-3 border ${isNeo ? 'rounded-none' : 'rounded-xl'} ${theme.cardSurfaceClass} px-3.5 py-2.5 transition-all duration-150 hover:-translate-y-0.5 motion-reduce:transform-none`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {item.title || 'Link'}
                          </p>
                          {item.description && (
                            <p className="text-[11px] opacity-70 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {itemUrl && (
                          <ArrowUpRight
                            className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ color: accent }}
                          />
                        )}
                      </a>
                    )
                  })}
                </div>
              )}

              {/* Services, Products & Custom Text: numbered/accent cards */}
              {!['skills', 'gallery', 'portfolio', 'achievements', 'certifications', 'links'].includes(
                sec.type,
              ) && (
                <div className="space-y-2">
                  {sec.items.map((item, idx) => {
                    const itemUrl = safeHref(item.url)
                    return (
                      <div
                        key={item.id}
                        style={{ borderColor: borderCol }}
                        className={`border ${isNeo ? 'rounded-none' : 'rounded-xl'} ${theme.cardSurfaceClass} p-3 space-y-1.5`}
                      >
                        {safeHref(item.image?.url) && (
                          <img
                            src={item.image.url}
                            alt={item.title || 'Section image'}
                            loading="lazy"
                            className="w-full h-28 object-cover rounded-lg mb-2"
                          />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {sec.type === 'services' ? (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 tabular-nums"
                                style={{
                                  backgroundColor: `${accent}1A`,
                                  color: accent,
                                }}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            ) : (
                              <Sparkles
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: accent }}
                              />
                            )}
                            <p className="text-xs font-semibold break-words">
                              {item.title}
                            </p>
                          </div>
                          {itemUrl && (
                            <a
                              href={isPreview ? undefined : itemUrl}
                              target={isPreview ? undefined : '_blank'}
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (isPreview) e.preventDefault()
                              }}
                              style={{ color: accent }}
                              className="text-[11px] font-medium inline-flex items-center gap-0.5 shrink-0 hover:underline"
                            >
                              <span>Open</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] opacity-75 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </section>
      ))}
    </>
  )
}
