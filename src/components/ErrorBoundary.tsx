import * as Sentry from "@sentry/react";
import { Component, ErrorInfo, ReactNode } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundaryClass extends Component<Props & { t: (key: string) => string }, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true, message: "" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-5">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold text-foreground mb-2">{t("somethingWentWrong")}</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">{t("unexpectedErrorDesc")}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: "" }); window.location.href = "/"; }}
            className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm"
          >
            {t("goToHome")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: Props) {
  const { t } = useLanguage();
  return <ErrorBoundaryClass t={t}>{children}</ErrorBoundaryClass>;
}
