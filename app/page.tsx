'use client'

import { useState } from 'react'
import { WalletConnect } from '@/components/wallet-connect'
import { NetworkSwitcher } from '@/components/network-switcher'
import { ReportIssueForm } from '@/components/report-issue-form'
import { IssuesDashboard } from '@/components/issues-dashboard'
import { AdminPanel } from '@/components/admin-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, BarChart3, Shield } from 'lucide-react'
import { useAccount } from 'wagmi'

export default function Page() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { isConnected } = useAccount()

  const handleIssueSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setActiveTab('dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CivicReport</h1>
                <p className="text-xs text-muted-foreground">Decentralized Issue Tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {
                isConnected && <NetworkSwitcher />
              }
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Community Issues
              </h2>
              <p className="text-muted-foreground">
                Monitor and track civic issues reported by community members
              </p>
            </div>
            <IssuesDashboard key={refreshTrigger} />
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Report an Issue
              </h2>
              <p className="text-muted-foreground">
                Help us improve the community by reporting infrastructure and public service issues
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ReportIssueForm onSuccess={handleIssueSuccess} />
              </div>
              <div className="space-y-4">
                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-3">How it Works</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                        1
                      </span>
                      <span>Connect your Web3 wallet</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                        2
                      </span>
                      <span>Upload issue details and image to IPFS</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                        3
                      </span>
                      <span>Submit transaction to smart contract</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                        4
                      </span>
                      <span>Track status and community confirmations</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-accent/5 p-6 rounded-lg border border-accent/20">
                  <h3 className="font-semibold mb-3">Benefits</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">✓</span>
                      <span>Transparent and immutable records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">✓</span>
                      <span>Decentralized verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">✓</span>
                      <span>Community-driven solutions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">✓</span>
                      <span>Secure identity with Web3</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Admin Controls
              </h2>
              <p className="text-muted-foreground">
                Manage issue statuses and platform settings
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <AdminPanel />
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">Admin Guide</h3>
                <ul className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">→</span>
                    <span>Review reported issues regularly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">→</span>
                    <span>Update status to keep community informed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">→</span>
                    <span>All updates are permanently recorded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">→</span>
                    <span>Invalid reports can be rejected</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-muted-foreground">
                CivicReport enables transparent community issue tracking using blockchain technology
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Features</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Decentralized reporting</li>
                <li>Multi-chain support</li>
                <li>Transparent tracking</li>
                <li>Community verification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Links</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Documentation</li>
                <li>GitHub Repository</li>
                <li>Support</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 CivicReport. All rights reserved. Powered by blockchain.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
