import { useTranslation } from 'react-i18next'
import { Col, Container, Row } from 'react-bootstrap'
import { LuChartLine, LuSearch, LuWallet } from 'react-icons/lu'
import { Section, Heading, StepCard, StepIcon, StepTitle, StepDescription } from './HowItWorks.styled.js'

const STEPS = [
  { key: 'search', icon: LuSearch },
  { key: 'compare', icon: LuChartLine },
  { key: 'buy', icon: LuWallet },
]

function HowItWorks() {
  const { t } = useTranslation()

  return (
    <Section>
      <Container>
        <Heading>{t('howItWorks.title')}</Heading>
        <Row className="g-4">
          {STEPS.map(({ key, icon: Icon }) => (
            <Col key={key} xs={12} md={4}>
              <StepCard>
                <StepIcon>
                  <Icon />
                </StepIcon>
                <StepTitle>{t(`howItWorks.steps.${key}.title`)}</StepTitle>
                <StepDescription>{t(`howItWorks.steps.${key}.description`)}</StepDescription>
              </StepCard>
            </Col>
          ))}
        </Row>
      </Container>
    </Section>
  )
}

export default HowItWorks
