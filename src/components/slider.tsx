import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import classNames from 'classnames'

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  componentStyle: {
    trackBg?: string
    selectedBg?: string
    thumbBg?: string
    thumbBorder?: string
    ringOffsetBg?: string
  }
}
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, componentStyle, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={classNames(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={classNames(
          'relative h-2 w-full grow overflow-hidden rounded-full',
          componentStyle.trackBg
        )}
      >
        <SliderPrimitive.Range
          className={classNames('absolute h-full', componentStyle.selectedBg)}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={classNames(
          'block h-5 w-5 rounded-full border-2  transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-ew-resize',
          componentStyle.thumbBg,
          componentStyle.thumbBorder,
          componentStyle.ringOffsetBg
        )}
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
