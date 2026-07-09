import styled from 'styled-components'

export const Section = styled.section`
  background-color: var(--color-border-light);
  padding: 2.5rem 0;
  margin-top: 1rem;
`

export const Heading = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary-green);
  text-align: center;
  margin-bottom: 2rem;
`

export const StepCard = styled.div`
  height: 100%;
  text-align: center;
  padding: 0 0.5rem;
`

export const StepIcon = styled.div`
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-primary-green);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 26px;
    height: 26px;
  }
`

export const StepTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-dark);
  margin-bottom: 0.4rem;
`

export const StepDescription = styled.p`
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
`
