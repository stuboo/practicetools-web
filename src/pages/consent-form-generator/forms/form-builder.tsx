import { MdOutlineInfo } from 'react-icons/md'
import { SelectedProcedureType, SourceType } from '../types'
import IUHealthForm from './iu_health'

interface FormBuilderProps {
  name: SourceType | null
  procedures: SelectedProcedureType
}

export default function FormBuilder({ name, procedures }: FormBuilderProps) {
  switch (name) {
    case 'IU Health':
      return <IUHealthForm procedures={procedures} />
    default:
      return (
        <div className="py-0 text-gray-400 flex items-center gap-2">
          <MdOutlineInfo />
          <p className="italic font-light">
            Appropriate Form would be displayed here
          </p>
        </div>
      )
  }
}
