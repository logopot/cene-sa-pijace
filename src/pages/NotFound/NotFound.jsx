import { useTranslation } from "react-i18next";
import {
  PageWrapper,
  Watermark,
  Content,
  Title,
  Description,
  HomeButton,
} from "./NotFound.styled.js";

function NotFound() {
  const { t } = useTranslation();

  return (
    <PageWrapper>
      <Watermark aria-hidden="true">404</Watermark>
      <Content>
        <Title>{t("404.title")}</Title>
        <Description>{t("404.description")}</Description>
        <HomeButton to="/">{t("404.button")}</HomeButton>
      </Content>
    </PageWrapper>
  );
}

export default NotFound;
