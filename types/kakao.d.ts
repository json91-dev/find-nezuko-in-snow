interface KakaoShareLink {
  mobileWebUrl: string;
  webUrl: string;
}

interface KakaoShareFeed {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    link: KakaoShareLink;
  };
  buttons?: Array<{
    title: string;
    link: KakaoShareLink;
  }>;
}

interface KakaoShareText {
  objectType: "text";
  text: string;
  link: KakaoShareLink;
  buttonTitle?: string;
}

interface KakaoStatic {
  init(appKey: string): void;
  isInitialized(): boolean;
  Share: {
    sendDefault(settings: KakaoShareFeed | KakaoShareText): void;
  };
}

declare global {
  interface Window {
    Kakao: KakaoStatic;
  }
}

export {};
