import { useEffect, useRef, useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import {
  Menu,
  MenuItem,
  MenuList,
  Trigger,
  TriggerLabel,
  SegmentTrigger,
  SegmentLabel,
  SegmentValue,
  Wrapper,
} from './CustomDropdown.styled.js'

// variant="segment" is FilterBar's desktop pill-bar cell (label on top,
// value below, no border of its own - see PillBar); the default "pill"
// variant is the standalone bordered trigger the mobile stepper still uses.
// Both share every bit of open/close/keyboard/outside-click behavior below;
// only the trigger's visual shell and its extra `label` differ.
// segmentPosition ('first' | 'middle' | 'last') only matters for the segment
// variant - it tells SegmentTrigger which corners of its hover/open
// highlight should follow PillBar's own outer curve (see
// CustomDropdown.styled.js). leadingAction is an optional
// ({ onSelect }) => ReactNode rendered above the option list (see
// FilterBar.jsx's Grad segment + LocationMenuItem.jsx) - calling onSelect is
// exactly like picking a normal option, applying the value and closing the
// menu.
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  variant = 'pill',
  label,
  segmentPosition,
  leadingAction,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Moves real DOM focus onto the active option whenever the menu opens or
  // the roving index changes - screen readers announce role="option" state
  // correctly only when the option itself is focused, not just highlighted.
  // Skipped when a leadingAction exists so Tab naturally lands there first
  // (it renders before the listbox in DOM order) instead of being jumped
  // over the moment the menu opens.
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && !leadingAction) {
      listRef.current?.children[activeIndex]?.focus()
    }
  }, [isOpen, activeIndex, leadingAction])

  const selectedOption = options.find((option) => option.value === value)

  const openMenu = () => {
    if (disabled || options.length === 0) return
    const selectedIndex = options.findIndex((option) => option.value === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setIsOpen(true)
  }

  const closeMenu = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleTriggerClick = () => {
    if (disabled) return
    if (isOpen) {
      setIsOpen(false)
    } else {
      openMenu()
    }
  }

  const handleTriggerKeyDown = (event) => {
    if (disabled || isOpen) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMenu()
    }
  }

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    closeMenu()
  }

  // A separate, deliberately ref-free selection path for leadingAction (see
  // the render call below) - leadingAction is a render prop, invoked
  // synchronously during render, and handleSelect's closeMenu reads
  // triggerRef.current, which React's ref-safety lint rule rejects passing
  // into anything called at render time. Skipping the refocus-on-select
  // behavior for this one path is an acceptable trade-off: picking "detect
  // my location" already re-renders the whole segment with a new city, so
  // returning focus to the trigger isn't as load-bearing as it is for a
  // normal option pick.
  const handleLeadingActionSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleListKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (activeIndex >= 0) handleSelect(options[activeIndex].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
    } else if (event.key === 'Tab') {
      setIsOpen(false)
    }
  }

  return (
    <Wrapper ref={wrapperRef}>
      {variant === 'segment' ?
        <SegmentTrigger
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          $isOpen={isOpen}
          $position={segmentPosition}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <SegmentLabel>{label}</SegmentLabel>
          <SegmentValue $isPlaceholder={!selectedOption}>
            {selectedOption ? selectedOption.label : placeholder}
          </SegmentValue>
        </SegmentTrigger>
      : <Trigger
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          $isOpen={isOpen}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <TriggerLabel $isPlaceholder={!selectedOption}>
            {selectedOption ? selectedOption.label : placeholder}
          </TriggerLabel>
          <LuChevronDown size={16} />
        </Trigger>
      }

      {isOpen && (
        <Menu>
          {leadingAction?.({ onSelect: handleLeadingActionSelect })}
          <MenuList role="listbox" ref={listRef} onKeyDown={handleListKeyDown}>
            {options.map((option, index) => (
              <MenuItem
                key={option.value}
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                $isSelected={option.value === value}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )}
    </Wrapper>
  )
}

export default CustomDropdown
