import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/hooks/useContent";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PrivacyPolicy = () => {
  const { t } = useLanguage();
  const { content, isLoading, error } = useContent('privacy_policy');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p>{t('errorLoadingContent') || 'Error loading content'}</p>
              </div>
            </CardContent>
          </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = content.title || t('privacyPolicy') || 'Privacy Policy';
  const lastUpdated = content.lastUpdated;
  const contentText = content.content || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{title}</CardTitle>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                {t('lastUpdated') || 'Last updated'}: {new Date(lastUpdated).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{contentText}</div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;