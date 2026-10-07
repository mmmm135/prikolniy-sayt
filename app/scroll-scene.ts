export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => {const t = clamp(value); return t * t * (3 - 2 * t);};

// Scroll-linked scenes share the browser's scroll; there is no wheel interception.
// Only schedule a paint when something changes, and stop painting off screen.
export function observeScrollScene(element: HTMLElement, paint: (progress: number, reduced: boolean) => void) {
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 let frame = 0, visible = true;
 const draw = () => {
  frame = 0;
  const bounds = element.getBoundingClientRect();
  const stage = element.querySelector<HTMLElement>('[data-scroll-stage]')!;
  const range = Math.max(1, element.offsetHeight - stage.offsetHeight);
  paint(clamp(-bounds.top / range), motion.matches || innerHeight <= 600);
 };
 const schedule = () => {if (visible && !frame) frame = requestAnimationFrame(draw);};
 const observer = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  // Finish the scene even if a fast scroll jumps past the last animation frame.
  if (!frame) frame = requestAnimationFrame(draw);
 }, {rootMargin: '100px'});
 observer.observe(element);
 const resizer = new ResizeObserver(schedule); resizer.observe(element);
 addEventListener('scroll', schedule, {passive: true});
 addEventListener('resize', schedule); motion.addEventListener('change', schedule);
 schedule();
 return () => {
  cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect();
  removeEventListener('scroll', schedule); removeEventListener('resize', schedule);
  motion.removeEventListener('change', schedule);
 };
}
