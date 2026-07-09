import styled from 'styled-components'

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 1.5rem 0 1rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-weight: 600;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: var(--color-primary-green);
    color: var(--color-primary-green);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-primary-green);
`

export const IconWrap = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--color-icon-bg);
  color: var(--color-primary-green);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 28px;
    height: 28px;
  }
`

export const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-dark);
`

export const Intro = styled.p`
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
`

export const SourceNotice = styled.div`
  background-color: var(--color-icon-bg);
  border-left: 4px solid var(--color-primary-green);
  border-radius: 6px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
`

export const Section = styled.section`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 1.5rem;
  }
`

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-dark);
  margin-bottom: 0.75rem;
`

export const Paragraph = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 0.85rem;

  &:last-child {
    margin-bottom: 0;
  }
`
