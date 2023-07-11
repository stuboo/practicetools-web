import { MdOutlineInfo } from 'react-icons/md'
import { SourceType } from '../types'
import IUHealthForm from './iu_health'
import IUHealthForm1 from './iu_health1'
import IUHealthForm2 from './iu_health2'

interface FormBuilderProps {
  name: SourceType | null
}

export default function FormBuilder({ name }: FormBuilderProps) {
  switch (name) {
    case 'iu health':
      return <IUHealthForm />
    case 'oauthc':
      return <IUHealthForm1 />
    case 'uch':
      return <IUHealthForm2 />
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
