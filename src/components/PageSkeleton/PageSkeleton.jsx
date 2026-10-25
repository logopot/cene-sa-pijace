import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { hasSnapshot } from '../../utils/snapshot.js'
import { Wrapper, Grid, CardPlaceholder } from './PageSkeleton.styled.js'

const PLACEHOLDER_COUNT = 8

// Skeleton cards shown while a page's data is still loading. Renders nothing
// when the pre-rendered snapshot is still on screen - it already shows the
// real content, so a second placeholder beneath it would just be noise.
function PageSkeleton() {
  const { t } = useTranslation()
  if (hasSnapshot()) return null

  return (
    <Wrapper role="status" aria-busy="true" aria-label={t('results.loading')}>
      <Container>
        <Grid>
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
            <CardPlaceholder key={index} />
          ))}
        </Grid>
      </Container>
    </Wrapper>
  )
}

export default PageSkeleton
