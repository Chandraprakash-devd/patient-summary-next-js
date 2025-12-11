"use client";

import { PatientData } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/data-processing";

interface PatientSummaryProps {
  patientData: PatientData;
  summaryText?: string;
}

export function PatientSummary({
  patientData,
  summaryText,
}: PatientSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">UID</p>
            <p className="font-medium">{patientData.p.uid}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">MR Number</p>
            <p className="font-medium">{patientData.p.mr}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Visits</p>
            <p className="font-medium">{patientData.p.v}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Visit Range</p>
            <p className="font-medium">
              {formatDate(patientData.p.f)} to {formatDate(patientData.p.l)}
            </p>
          </div>
        </div>

        {summaryText && (
          <div className="pt-4 border-t">
            <p className="text-sm leading-relaxed">{summaryText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
