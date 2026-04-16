export const metadata = {
  title: "보인고 2차 모의내신",
  description: "보인고 1학년 2차 모의내신 시험",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        background: "#f3f4f6",
        minHeight: "100vh",
        WebkitTapHighlightColor: "transparent",
      }}>
        {children}
      </body>
    </html>
  );
}
