import { describe, it, expect } from 'vitest'
import { joinClasses } from './joinClasses'

describe('joinClasses', () => {
  it('should join multiple class names', () => {
    expect(joinClasses('class1', 'class2', 'class3')).toBe('class1 class2 class3')
  })

  it('should filter out falsy values', () => {
    expect(joinClasses('class1', false, 'class2', undefined, 'class3')).toBe('class1 class2 class3')
  })

  it('should handle empty input', () => {
    expect(joinClasses()).toBe('')
  })

  it('should handle all falsy values', () => {
    expect(joinClasses(false, undefined, false)).toBe('')
  })

  it('should handle single class name', () => {
    expect(joinClasses('single-class')).toBe('single-class')
  })

  it('should handle mixed truthy and falsy values', () => {
    const isActive = true
    const isDisabled = false
    expect(joinClasses('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active')
  })
})
