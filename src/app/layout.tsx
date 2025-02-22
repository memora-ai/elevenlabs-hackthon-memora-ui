'use client';

import localFont from "next/font/local";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import "./globals.css";
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import React from 'react';
import Header from '@/components/layout/Header';
import SideMenu from '@/components/layout/SideMenu';
import { SideMenuProvider } from '@/contexts/SideMenuContext';
import { MemoraProvider } from '@/contexts/MemoraContext';
import ClientMainContent from "./ClientMainContent";
import { Toaster } from 'react-hot-toast';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <html lang="pt-br">
        <UserProvider>
          <SideMenuProvider>
            <MemoraProvider>
              <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <Header />
                <SideMenu />
                <ClientMainContent>
                  <Toaster />
                  {children}
                </ClientMainContent>
              </body>
            </MemoraProvider>
          </SideMenuProvider>
        </UserProvider>
      </html>
    </I18nextProvider>
  );
}
