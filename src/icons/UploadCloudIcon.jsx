export function UploadCloudIcon({
  size = 24,
  color = 'currentColor',
  title,
  ...props
}) {
  const accessibilityProps = title ? { 'aria-label': title } : { 'aria-hidden': true };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...accessibilityProps}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M7 18.25A4.25 4.25 0 0 1 7 9.75C7.9 7.09 10.36 5.25 13.26 5.25C16.18 5.25 18.75 7.32 19.3 10.08A4.28 4.28 0 0 1 17.75 18.25H7Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 9.5V15.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9.5 12L12 9.5L14.5 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  );
}
