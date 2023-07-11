import TextArea from '../../../components/textarea'
import Input from '../../../components/input'

export default function IUHealthForm1() {
  return (
    <div className="flex flex-col gap-3">
      <TextArea label="Procedures (OAU)" />
      <Input label="Other Risks" />
      <Input label="Alternatives" />
      <div className="flex gap-8">
        <Input type="date" label="Date" />
        <Input type="time" label="Time" />
      </div>
    </div>
  )
}
