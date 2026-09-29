import React from 'react';
import { EmptyState } from './EmptyState';
import { colors } from '../theme/colors';

interface ErrorStateProps {
    title?: string;
    description?: string;
    buttonTitle?: string;
    onRetry?: () => void;
}

export function ErrorState({
    title = 'Something went wrong',
    description = 'Please check your internet connection and try again.',
    buttonTitle = 'Try again',
    onRetry,
}: ErrorStateProps) {
    return (
        <EmptyState
            title={title}
            description={description}
            icon="alert"
            iconColor={colors.danger}
            iconBg={colors.dangerBg}
            buttonTitle={onRetry ? buttonTitle : undefined}
            onButtonPress={onRetry}
        />
    );
}
