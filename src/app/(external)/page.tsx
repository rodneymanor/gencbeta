import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirecting...",
  description: "Redirecting to dashboard",
};

export default function Home() {
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=/dashboard" />
      </head>
      <body>
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <h1>Redirecting...</h1>
          <p>
            If you are not redirected automatically, <a href="/dashboard">click here</a>.
          </p>
        </div>
      </body>
    </html>
  );
}
