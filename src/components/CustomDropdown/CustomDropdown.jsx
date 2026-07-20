import { useEffect, useRef, useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import { Menu, MenuItem, MenuList, Trigger, TriggerLabel, Wrapper } from './CustomDropdown.styled.js'

function CustomDropdown({ options, value, onChange, placeholder, disabled = false }) {
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
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.focus()
    }
  }, [isOpen, activeIndex])

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
      <Trigger
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

      {isOpen && (
        <Menu>
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
