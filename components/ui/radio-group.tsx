"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
}

const RadioGroupContext = React.createContext<{
  selectedValue: string
  onValueChange: (value: string) => void
}>({
  selectedValue: "",
  onValueChange: () => {},
})

const RadioGroup: React.FC<RadioGroupProps> = ({ value = "", onValueChange = () => {}, children, className }) => {
  const [selectedValue, setSelectedValue] = React.useState(value)

  React.useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange(newValue)
  }

  return (
    <RadioGroupContext.Provider value={{ selectedValue, onValueChange: handleValueChange }}>
      <div className={cn("grid gap-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  )
}

const RadioGroupItem: React.FC<RadioGroupItemProps> = ({ value, id, className }) => {
  const { selectedValue, onValueChange } = React.useContext(RadioGroupContext)
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      id={id}
      onClick={() => onValueChange(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isSelected && (
        <div className="flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-current" />
        </div>
      )}
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
