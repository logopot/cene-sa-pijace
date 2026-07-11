import { useEffect, useRef, useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import { Menu, MenuItem, Trigger, TriggerLabel, Wrapper } from './CustomDropdown.styled.js'

function CustomDropdown({ options, value, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedOption = options.find((option) => option.value === value)

  const handleToggle = () => {
    if (disabled) return
    setIsOpen((open) => !open)
  }

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        onClick={handleToggle}
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
        <Menu role="listbox">
          {options.map((option) => (
            <MenuItem
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              $isSelected={option.value === value}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Wrapper>
  )
}

export default CustomDropdown
