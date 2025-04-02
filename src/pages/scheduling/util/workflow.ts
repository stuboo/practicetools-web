// Define types for the scheduling workflow
export type NodeType = 'start' | 'question' | 'action' | 'result';
export type ProviderType = 'APP' | 'Guanzon' | 'Stewart';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  text: string;
  options?: WorkflowOption[];
  result?: ProviderType;
  redirectToQuid6?: boolean;
}

export interface WorkflowOption {
  text: string;
  nextNodeId: string;
}

// Define the scheduling workflow based on the flowchart
export const workflowNodes: Record<string, WorkflowNode> = {
  start: {
    id: 'start',
    type: 'start',
    text: 'Start the scheduling workflow',
    options: [
      {
        text: 'Continue',
        nextNodeId: 'patientAge'
      }
    ]
  },
  patientAge: {
    id: 'patientAge',
    type: 'question',
    text: 'What is the patient\'s age?',
    options: [
      {
        text: 'Under 30 or over 80',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: '30-80',
        nextNodeId: 'chiefComplaint'
      }
    ]
  },
  chiefComplaint: {
    id: 'chiefComplaint',
    type: 'question',
    text: 'What is the patient\'s chief complaint?',
    options: [
      {
        text: 'Urinary Incontinence',
        nextNodeId: 'quid6Questionnaire'
      },
      {
        text: 'Recurrent UTIs',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Pelvic Pain',
        nextNodeId: 'physicianReview'
      },
      {
        text: 'Vaginal Dryness',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Fecal Incontinence',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Urinary Frequency',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Overactive Bladder',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Urinary Retention',
        nextNodeId: 'physicianReview'
      },
      {
        text: 'Pelvic Organ Prolapse',
        nextNodeId: 'likelySurgical'
      }
    ]
  },
  physicianReview: {
    id: 'physicianReview',
    type: 'action',
    text: 'This case requires physician review',
    options: [
      {
        text: 'Continue',
        nextNodeId: 'scheduleWithAPP'
      }
    ]
  },
  quid6Questionnaire: {
    id: 'quid6Questionnaire',
    type: 'question',
    text: 'QUID-6 Questionnaire - Please complete the QUID-6 assessment to determine the appropriate provider',
    redirectToQuid6: true,
    options: [
      {
        text: 'Stress Incontinence',
        nextNodeId: 'likelySurgical'
      },
      {
        text: 'Urge Incontinence',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Urge Predominant Mixed',
        nextNodeId: 'scheduleWithAPP'
      },
      {
        text: 'Stress Predominant Mixed',
        nextNodeId: 'likelySurgical'
      }
    ]
  },
  likelySurgical: {
    id: 'likelySurgical',
    type: 'action',
    text: 'This case likely requires surgical evaluation',
    options: [
      {
        text: 'Continue',
        nextNodeId: 'scheduleWithSurgeon'
      }
    ]
  },
  scheduleWithSurgeon: {
    id: 'scheduleWithSurgeon',
    type: 'question',
    text: 'Schedule with which surgeon?',
    options: [
      {
        text: 'Schedule with Dr. Guanzon',
        nextNodeId: 'resultGuanzon'
      },
      {
        text: 'Schedule with Dr. Stewart',
        nextNodeId: 'resultStewart'
      }
    ]
  },
  scheduleWithAPP: {
    id: 'scheduleWithAPP',
    type: 'result',
    text: 'Based on the information provided, the patient should be scheduled with an Advanced Practice Provider (APP)',
    result: 'APP'
  },
  resultGuanzon: {
    id: 'resultGuanzon',
    type: 'result',
    text: 'Based on the information provided, the patient should be scheduled with Dr. Guanzon',
    result: 'Guanzon'
  },
  resultStewart: {
    id: 'resultStewart',
    type: 'result',
    text: 'Based on the information provided, the patient should be scheduled with Dr. Stewart',
    result: 'Stewart'
  }
};

// Helper function to get the initial node
export const getInitialNode = (): WorkflowNode => {
  return workflowNodes.start;
};

// Helper function to get the next node based on the current node and selected option
export const getNextNode = (currentNodeId: string, selectedOptionIndex: number): WorkflowNode | null => {
  const currentNode = workflowNodes[currentNodeId];
  if (!currentNode || !currentNode.options || currentNode.options.length <= selectedOptionIndex) {
    return null;
  }

  const nextNodeId = currentNode.options[selectedOptionIndex].nextNodeId;
  return workflowNodes[nextNodeId] || null;
}; 