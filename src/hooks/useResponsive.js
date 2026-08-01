import { useEffect, useState } from "react";

// Breakpoints do projeto, cobrindo mais tamanhos de aparelho:
// mobileSmall  -> celulares pequenos (iPhone SE, Android compactos)   até 380px
// mobile       -> celulares médios/grandes (iPhone padrão, Android)   381–640px
// tabletSmall  -> celulares grandes em paisagem / tablets pequenos    641–768px
// tablet       -> tablets (iPad, Android tablets)                     769–1024px
// desktop      -> notebooks e monitores                               acima de 1024px
export const BREAKPOINTS = {
  mobileSmall: 380,
  mobile: 640,
  tabletSmall: 768,
  tablet: 1024
};

function calcular() {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 800,
      isMobileSmall: false,
      isMobile: false,
      isTabletSmall: false,
      isTablet: false,
      isDesktop: true,
      isShort: false,
      isVeryShort: false
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const isMobileSmall = width <= BREAKPOINTS.mobileSmall;
  const isMobileLarge = width > BREAKPOINTS.mobileSmall && width <= BREAKPOINTS.mobile;
  const isTabletSmall = width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tabletSmall;
  const isTabletLarge = width > BREAKPOINTS.tabletSmall && width <= BREAKPOINTS.tablet;

  return {
    width,
    height,
    isMobileSmall,
    // isMobile continua cobrindo todo o intervalo de celular (compatibilidade)
    isMobile: isMobileSmall || isMobileLarge,
    isMobileLarge,
    isTabletSmall,
    // isTablet continua cobrindo todo o intervalo de tablet (compatibilidade)
    isTablet: isTabletSmall || isTabletLarge,
    isTabletLarge,
    isDesktop: width > BREAKPOINTS.tablet,
    // pouca altura disponível (notebook com barra de endereços, tablet
    // deitado, celular deitado etc.) — independe da largura da tela
    isShort: height <= 850,
    isVeryShort: height <= 650
  };
}

// Hook para saber, em tempo real, qual a faixa de tela atual.
// Não altera nenhum estilo por conta própria: apenas informa o breakpoint
// para que o componente decida (mesclando com o objeto "styles" já existente).
export default function useResponsive() {
  const [estado, setEstado] = useState(calcular);

  useEffect(() => {
    function aoRedimensionar() {
      setEstado(calcular());
    }

    window.addEventListener("resize", aoRedimensionar);
    window.addEventListener("orientationchange", aoRedimensionar);

    return () => {
      window.removeEventListener("resize", aoRedimensionar);
      window.removeEventListener("orientationchange", aoRedimensionar);
    };
  }, []);

  return estado;
}
