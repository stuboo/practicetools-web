// Define types for the scheduling workflow
export type NodeType = 'start' | 'question' | 'action' | 'result' | 'quid6';
export type ProviderType = 'APP' | 'Guanzon' | 'Stewart';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  text: string;
  options?: WorkflowOption[];
  result?: ProviderType;
  isQuid6?: boolean;
}

export interface WorkflowOption {
  text: string;
  nextNodeId: string;
}

// Define the scheduling workflow based on the flowchart
export const workflowNodes: Record<string, WorkflowNode> = {
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
        nextNodeId: 'quid6Start'
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
        nextNodeId: 'scheduleWithSurgeon'
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
  quid6Start: {
    id: 'quid6Start',
    type: 'quid6',
    text: 'QUID-6 Questionnaire',
    isQuid6: true
  },
  scheduleWithSurgeon: {
    id: 'scheduleWithSurgeon',
    type: 'result',
    text: 'Schedule with a surgeon for evaluation.',
    result: 'Guanzon'
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
  return workflowNodes.patientAge;
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