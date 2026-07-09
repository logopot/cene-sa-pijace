import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { LuArrowLeft, LuScale } from 'react-icons/lu'
import {
  BackButton,
  PageHeader,
  IconWrap,
  Title,
  Intro,
  SourceNotice,
  Section,
  SectionTitle,
  Paragraph,
} from './DisclaimerPage.styled.js'

function DisclaimerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Container>
      <BackButton type="button" onClick={() => navigate('/')}>
        <LuArrowLeft />
        {t('disclaimer.back')}
      </BackButton>

      <PageHeader>
        <IconWrap>
          <LuScale />
        </IconWrap>
        <Title>{t('disclaimer.title')}</Title>
      </PageHeader>

      <Intro>{t('disclaimer.intro')}</Intro>

      <SourceNotice>
        <SectionTitle>{t('disclaimer.sourceHeading')}</SectionTitle>
        <Paragraph>{t('disclaimer.sourceBody')}</Paragraph>
      </SourceNotice>

      <Section>
        <SectionTitle>{t('disclaimer.liabilityHeading')}</SectionTitle>
        <Paragraph>{t('disclaimer.liabilityBody1')}</Paragraph>
        <Paragraph>{t('disclaimer.liabilityBody2')}</Paragraph>
        <Paragraph>{t('disclaimer.liabilityBody3')}</Paragraph>
      </Section>
    </Container>
  )
}

export default DisclaimerPage
