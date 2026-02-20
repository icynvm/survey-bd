import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AppProvider } from '@/contexts/AppContext';
import { Toast, useToast } from '@/components/ui';

export default function App({ Component, pageProps }: AppProps) {
    const { messages, remove } = useToast();
    return (
        <AppProvider>
            <Component {...pageProps} />
            <Toast messages={messages} remove={remove} />
        </AppProvider>
    );
}
