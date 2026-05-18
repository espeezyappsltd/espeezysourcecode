'use client'

import { TaskModalProps } from '@/types/ui'
import { isOnboardingDescription } from '@/lib/onboarding/dashboard-tasks'
import OnboardingTourButton from '@/components/onboarding/OnboardingTourButton'
import { TaskModalEvidence } from './task-modal/TaskModalEvidence'
import { TaskModalFooter } from './task-modal/TaskModalFooter'
import { TaskModalForm } from './task-modal/TaskModalForm'
import { TaskModalHeader } from './task-modal/TaskModalHeader'
import { useTaskModal } from './task-modal/useTaskModal'

export default function TaskModal(props: TaskModalProps) {
  const modal = useTaskModal(props)

  return (
    <div className="modal-overlay" onClick={modal.onClose}>
      <div
        className="modal-content task-modal-responsive"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          width: '95%',
          maxWidth: '650px',
          height: 'auto',
          maxHeight: 'calc(100dvh - 8rem)',
        }}
      >
        <TaskModalHeader
          isEditMode={modal.isEditMode}
          assignees={modal.assignees}
          members={modal.members}
          onClose={modal.onClose}
          onProfileClick={modal.onProfileClick}
        />

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {modal.error && (
            <div className="error-message" style={{ marginBottom: '1.5rem' }}>
              {modal.error}
            </div>
          )}

          {isOnboardingDescription(modal.description) && (
            <div
              className="onboarding-tour-banner"
              style={{
                marginBottom: '1.25rem',
                padding: '1rem 1.1rem',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sub)', flex: '1 1 200px' }}>
                Espeezy feature tour — open the page, try it, then set status to Done.
              </p>
              {modal.onboardingTour ? (
                <OnboardingTourButton action={modal.onboardingTour} variant="modal" onNavigate={modal.onClose} />
              ) : null}
            </div>
          )}

          <TaskModalForm
            title={modal.title}
            setTitle={modal.setTitle}
            description={modal.description}
            setDescription={modal.setDescription}
            status={modal.status}
            setStatus={modal.setStatus}
            category={modal.category}
            setCategory={modal.setCategory}
            dueDate={modal.dueDate}
            setDueDate={modal.setDueDate}
            members={modal.members}
            assignees={modal.assignees}
            searchQuery={modal.searchQuery}
            setSearchQuery={modal.setSearchQuery}
            onlineUsers={modal.onlineUsers}
            handleAIGenerate={modal.handleAIGenerate}
            aiLoading={modal.aiLoading}
            aiError={modal.aiError}
            toggleMemberAssignment={modal.toggleMemberAssignment}
          />

          {modal.isEditMode && (
            <TaskModalEvidence
              evidenceLoading={modal.evidenceLoading}
              uploading={modal.uploading}
              artifacts={modal.artifacts}
              newUrl={modal.newUrl}
              setNewUrl={modal.setNewUrl}
              currentUser={modal.currentUser}
              task={modal.task}
              handleUploadEvidence={modal.handleUploadEvidence}
              handlePhysicalUpload={modal.handlePhysicalUpload}
              handleDeleteArtifact={modal.handleDeleteArtifact}
              handleEndorse={modal.handleEndorse}
            />
          )}
        </div>

        <TaskModalFooter
          isEditMode={modal.isEditMode}
          loading={modal.loading}
          onClose={modal.onClose}
          handleSave={modal.handleSave}
          handleDelete={modal.handleDelete}
        />

        <style jsx>{`
          @media (max-width: 480px) {
            .hide-tiny {
              display: none;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
