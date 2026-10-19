import { Component } from 'react'
import Button from '@/shared/ui/Button.jsx'
import EmptyState from '@/shared/ui/EmptyState.jsx'
import es from '@/i18n/es.js'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    const t = es.common.crash
    return (
      <main className="mx-auto max-w-3xl p-6">
        <EmptyState
          title={t.title}
          description={t.description}
          action={<Button onClick={() => window.location.reload()}>{t.reload}</Button>}
        />
      </main>
    )
  }
}
